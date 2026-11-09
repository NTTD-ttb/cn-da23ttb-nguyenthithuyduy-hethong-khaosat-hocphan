"""Nghiệp vụ quản lý Người dùng — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResetPassword
from app.utils.security import hash_password


def get_all_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: str | None = None,
    search: str | None = None,
) -> list[User]:
    """Lấy danh sách người dùng, hỗ trợ tìm theo email và lọc theo role."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


def get_user_by_id(db: Session, user_id: int) -> User:
    """Lấy 1 người dùng theo ID."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy người dùng ID={user_id}."
        )
    return user


def create_user(db: Session, data: UserCreate) -> User:
    """Tạo người dùng mới và băm mật khẩu bảo mật."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{data.email}' đã được sử dụng."
        )

    # Băm mật khẩu bằng hàm hash_password ở tuần 4
    hashed = hash_password(data.password)
    user_data = data.model_dump()
    user_data.pop("password")  # Bỏ mật khẩu thô

    user = User(**user_data, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    """Cập nhật thông tin tài khoản người dùng."""
    user = get_user_by_id(db, user_id)

    # Nếu cập nhật email, kiểm tra trùng lặp với người khác
    if data.email and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{data.email}' đã được sử dụng."
            )

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: int, data: UserResetPassword) -> User:
    """Admin reset mật khẩu cho người dùng và bật cờ bắt buộc đổi pass."""
    user = get_user_by_id(db, user_id)
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = True  # Yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    """Xóa tài khoản nếu chưa có ràng buộc dữ liệu."""
    user = get_user_by_id(db, user_id)

    # Ràng buộc: không xóa nếu đã có yêu cầu hỗ trợ hoặc thông báo
    if user.contact_requests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa người dùng đã phát sinh yêu cầu hỗ trợ."
        )

    db.delete(user)
    db.commit()