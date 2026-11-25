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
    """Tạo người dùng mới và băm mật khẩu bảo mật (hỗ trợ tạo profile sinh viên nếu có)."""
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{data.email}' đã được sử dụng."
        )

    # Băm mật khẩu bằng hàm hash_password ở tuần 4
    hashed = hash_password(data.password)
    user_data = data.model_dump()
    user_data.pop("password", None)
    student_code = user_data.pop("student_code", None)
    full_name = user_data.pop("full_name", None)
    class_id = user_data.pop("class_id", None)

    user = User(**user_data, password_hash=hashed)
    db.add(user)
    db.flush()

    if data.role == "student" and (student_code or full_name):
        from app.models.student import StudentProfile
        if student_code:
            existing_st = db.query(StudentProfile).filter(StudentProfile.student_code == student_code).first()
            if existing_st:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Mã sinh viên '{student_code}' đã tồn tại."
                )
        profile = StudentProfile(
            student_id=user.user_id,
            student_code=student_code or user.email.split("@")[0],
            full_name=full_name or "Sinh viên",
            class_id=class_id or 1,
        )
        db.add(profile)

    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    """Cập nhật thông tin tài khoản người dùng và hồ sơ sinh viên nếu có."""
    user = get_user_by_id(db, user_id)

    # Nếu cập nhật email, kiểm tra trùng lặp với người khác
    if data.email and data.email != user.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{data.email}' đã được sử dụng."
            )

    update_dict = data.model_dump(exclude_none=True)
    student_code = update_dict.pop("student_code", None)
    full_name = update_dict.pop("full_name", None)
    class_id = update_dict.pop("class_id", None)

    for field, value in update_dict.items():
        setattr(user, field, value)

    if user.student_profile and any([student_code, full_name, class_id]):
        if student_code is not None:
            user.student_profile.student_code = student_code
        if full_name is not None:
            user.student_profile.full_name = full_name
        if class_id is not None:
            user.student_profile.class_id = class_id

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