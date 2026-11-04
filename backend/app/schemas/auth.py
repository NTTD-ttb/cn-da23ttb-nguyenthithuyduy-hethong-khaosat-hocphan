"""
Pydantic schemas cho xác thực:
- LoginRequest:  dữ liệu người dùng gửi lên khi đăng nhập.
- TokenResponse: dữ liệu server trả về sau khi đăng nhập thành công.
- TokenPayload:  thông tin được giải mã từ JWT (dùng nội bộ).
"""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Body của POST /auth/login."""
    email: str        # Dùng str thay EmailStr để hỗ trợ cả mssv nếu cần sau này
    password: str


class TokenResponse(BaseModel):
    """Response trả về sau khi login thành công."""
    access_token: str
    token_type: str = "bearer"
    role: str           # "student" hoặc "admin" — giúp frontend biết redirect về đâu
    must_change_password: bool  # Nếu True, frontend bắt đổi mật khẩu ngay


class TokenPayload(BaseModel):
    """Thông tin được giải mã từ JWT payload (dùng nội bộ)."""
    sub: str    # user_id dưới dạng string
    role: str
    exp: int    # Unix timestamp hết hạn