r"""
Điểm khởi chạy (entry point) của backend FastAPI.

Cách chạy (từ thư mục backend/):
    .\.venv\Scripts\Activate.ps1
    uvicorn app.main:app --reload --port 8000

Tài liệu API tự sinh: http://127.0.0.1:8000/docs
"""

from pathlib import Path

from fastapi import FastAPI
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL, create_engine, text

# ---------------------------------------------------------------------------
# 1. Đường dẫn gốc của backend (chính là thư mục chứa file .env)
#    main.py nằm ở backend/app/main.py -> parent = app/, parent.parent = backend/
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# 2. Cấu hình đọc từ file backend/.env
#    Không ghi mật khẩu trực tiếp trong mã nguồn.
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "HeThongKhaoSat"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Tạo URL kết nối bằng URL.create để không phải tự mã hóa ký tự đặc biệt
# trong mật khẩu. Driver "psycopg" là psycopg phiên bản 3.
DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
)

# Engine quản lý connection pool tới PostgreSQL.
# pool_pre_ping=True: tự kiểm tra kết nối còn sống trước khi dùng.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


# ---------------------------------------------------------------------------
# 3. Khởi tạo ứng dụng FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Hệ thống khảo sát học phần",
    description="API thu thập và phân tích phản hồi của sinh viên về học phần.",
    version="0.1.0",
)


@app.get("/", tags=["Hệ thống"])
def read_root() -> dict:
    """Kiểm tra nhanh backend đã chạy chưa."""
    return {
        "message": "Backend đang hoạt động.",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Hệ thống"])
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
