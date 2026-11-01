"""
Kết nối PostgreSQL dùng chung cho toàn bộ backend.

Bao gồm:
- `DATABASE_URL`: chuỗi kết nối được tạo từ cấu hình trong `.env`.
- `engine`: connection pool của SQLAlchemy.
- `SessionLocal`: factory tạo session cho từng HTTP request.
- `Base`: lớp cha cho toàn bộ model ORM (khai báo trong `app/models/`).
- `get_db()`: dependency của FastAPI, tự đóng session sau mỗi request.

Quy tắc: mọi model/router/service chỉ import từ module này,
TUYỆT ĐỐI không import từ `app.main` để tránh import vòng.
"""

from collections.abc import Generator

from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# URL.create giúp không phải tự mã hoá các ký tự đặc biệt trong mật khẩu.
# Driver "psycopg" là psycopg phiên bản 3.
DATABASE_URL = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
)

# pool_pre_ping=True: tự kiểm tra kết nối còn sống trước khi sử dụng.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# autoflush=False: không tự đẩy thay đổi xuống DB trước mỗi truy vấn.
# expire_on_commit=False: giữ nguyên giá trị thuộc tính sau khi commit,
# tránh việc ORM truy vấn lại DB khi serialize response.
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Lớp cha cho toàn bộ model ORM của hệ thống."""


def get_db() -> Generator[Session, None, None]:
    """
    Dependency cung cấp session CSDL cho mỗi request.

    Session luôn được đóng trong `finally`, kể cả khi xử lý request bị lỗi,
    nhờ đó không rò rỉ kết nối trong connection pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
