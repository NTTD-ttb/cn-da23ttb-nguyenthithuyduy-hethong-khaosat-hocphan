"""
Router xác thực: đăng nhập và đăng xuất.

Endpoints:
    POST /auth/login   → nhận email+password, trả về JWT token.
    POST /auth/logout  → phía server không làm gì (JWT stateless),
                         client tự xoá token; endpoint này để frontend
                         có chỗ gọi một cách nhất quán.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Xác thực"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Đăng nhập",
    description="Nhận email và mật khẩu, trả về JWT access token nếu hợp lệ.",
)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    # Bước 1: Tìm user theo email
    user = db.query(User).filter(User.email == body.email).first()

    # Bước 2: Kiểm tra user tồn tại và password đúng
    # Dùng cùng 1 thông báo lỗi để tránh lộ thông tin (email tồn tại hay không)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng.",
        )

    # Bước 3: Tạo JWT token với thông tin cần thiết
    token = create_access_token(
        data={"sub": str(user.user_id), "role": user.role}
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        must_change_password=user.must_change_password,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Đăng xuất",
    description="JWT là stateless nên server không cần làm gì. Client tự xoá token.",
)
def logout() -> None:
    # JWT không có cơ chế thu hồi phía server (stateless).
    # Nếu sau này cần blacklist token, có thể lưu jti vào Redis tại đây.
    return None


