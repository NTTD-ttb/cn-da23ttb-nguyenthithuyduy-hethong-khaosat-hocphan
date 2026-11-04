"""
FastAPI dependencies cho xác thực và phân quyền.

Cách dùng trong router:
    @router.get("/me")
    def get_me(current_user: User = Depends(get_current_user)):
        return current_user

    @router.delete("/users/{id}")
    def delete_user(admin: User = Depends(require_admin)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

# HTTPBearer tự động đọc header "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency: giải mã JWT, trả về User đang đăng nhập.
    Raise 401 nếu token không hợp lệ hoặc user không tồn tại.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không chứa thông tin người dùng.",
        )

    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại.",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: chỉ cho phép tài khoản có role = 'admin' tiếp tục.
    Raise 403 nếu là sinh viên.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới có quyền thực hiện thao tác này.",
        )
    return current_user


def require_student(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency: chỉ cho phép tài khoản có role = 'student' tiếp tục.
    Raise 403 nếu là admin.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ sinh viên mới có quyền thực hiện thao tác này.",
        )
    return current_user