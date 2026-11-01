"""
Router dùng chung: kiểm tra backend đang chạy và kiểm tra kết nối CSDL.

Đây cũng là ví dụ mẫu về cách viết một router:
- Router chỉ nhận request và trả response.
- Cấu hình/CSDL được import từ `app.core`, KHÔNG import từ `app.main`,
  nhờ đó không tạo ra import vòng.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine

router = APIRouter(tags=["Hệ thống"])


@router.get("/")
def read_root() -> dict:
    """Kiểm tra nhanh backend đã chạy chưa."""
    return {
        "message": "Backend đang hoạt động.",
        "docs": "/docs",
    }


@router.get("/api/health")
def health_check() -> dict:
    """
    Kiểm tra kết nối PostgreSQL bằng SQLAlchemy + `SELECT 1`.

    Luôn trả về HTTP 200 kèm trạng thái, để phía frontend dễ hiển thị.
    Không trả về mật khẩu hay chuỗi kết nối đầy đủ.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - cần bắt mọi lỗi kết nối
        return {
            "status": "error",
            "database": "disconnected",
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "name": settings.DB_NAME,
            "error_type": type(exc).__name__,
            "hint": (
                "Kiểm tra PostgreSQL đã chạy, thông tin trong backend/.env "
                "và database đã được tạo hay chưa."
            ),
        }

    return {
        "status": "ok",
        "database": "connected",
        "host": settings.DB_HOST,
        "port": settings.DB_PORT,
        "name": settings.DB_NAME,
    }
