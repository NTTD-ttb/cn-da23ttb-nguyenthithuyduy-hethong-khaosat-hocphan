"""
Cấu hình của ứng dụng, đọc từ file `backend/.env`.

File này được tách khỏi `app/main.py` để các thành phần khác (models, routers,
services, script CLI, alembic, script huấn luyện NLP) có thể đọc cấu hình mà
KHÔNG cần nạp ứng dụng FastAPI. Nhờ vậy tránh được import vòng.

Quy tắc: không ghi mật khẩu trực tiếp trong mã nguồn, chỉ đọc từ biến môi trường.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py nằm ở backend/app/core/config.py
#   parent = core/  -> parent.parent = app/  -> parent.parent.parent = backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):


    """Khai báo các biến môi trường mà hệ thống sử dụng."""

    # ------------------------------------------------------------------
    # Cơ sở dữ liệu PostgreSQL
    # ------------------------------------------------------------------
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "HeThongKhaoSat"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # cấu hình bảo mật và thời hạn đăng nhập cho hệ thống
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60   
    # ------------------------------------------------------------------
    # CORS: danh sách origin của frontend, phân tách bằng dấu phẩy.
    # Mặc định là địa chỉ mặc định của Vite (React) khi chạy `npm run dev`.
    # ------------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        """Trả về danh sách origin đã được tách và loại bỏ khoảng trắng."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """
    Đọc cấu hình đúng một lần cho toàn bộ vòng đời ứng dụng.

    `lru_cache` giúp tránh việc đọc lại file .env ở mỗi lần gọi và giữ nguyên
    một đối tượng Settings duy nhất trong tiến trình.
    """
    return Settings()


settings = get_settings()
