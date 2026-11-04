"""Model ORM cho bảng users — tài khoản đăng nhập."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id              = Column(BigInteger, primary_key=True, autoincrement=True)
    email                = Column(String(255), nullable=False, unique=True)
    password_hash        = Column(String(255), nullable=False)
    role                 = Column(String(20),  nullable=False)
    must_change_password = Column(Boolean,     nullable=False, default=False)
    created_account      = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_account      = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Quan hệ ngược (backref) — tuỳ chọn, giúp truy vấn dễ hơn
    student_profile  = relationship("StudentProfile",  back_populates="user", uselist=False)
    contact_requests = relationship("ContactRequest",  back_populates="user", foreign_keys="ContactRequest.user_id")
    notifications    = relationship("Notification",    back_populates="user")