"""
Tiện ích bảo mật: mã hoá mật khẩu và xử lý JWT.

Hai nhiệm vụ chính:
- hash_password / verify_password: dùng bcrypt để lưu password an toàn.
- create_access_token / decode_access_token: tạo và đọc JWT.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

from fastapi.security import HTTPBearer
bearer_scheme = HTTPBearer()

# CryptContext dùng bcrypt để hash password.
# deprecated="auto" tự động nâng cấp các hash cũ khi người dùng đăng nhập.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"  # Thuật toán ký JWT


# ---------------------------------------------------------------------------
# Password
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """Băm mật khẩu thô thành chuỗi bcrypt để lưu vào DB."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu thô có khớp với hash trong DB không."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Tạo JWT access token.

    Args:
        data: dict chứa thông tin cần mã hoá (thường là {"sub": str(user_id), "role": role}).
        expires_delta: thời gian sống của token; mặc định dùng giá trị trong settings.

    Returns:
        Chuỗi JWT đã ký.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Giải mã JWT token.

    Returns:
        dict payload nếu token hợp lệ, None nếu token hết hạn hoặc sai chữ ký.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None