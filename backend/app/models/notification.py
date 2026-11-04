"""Model ORM cho bảng notifications — thông báo hệ thống."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id      = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id              = Column(BigInteger, ForeignKey("users.user_id"))
    title                = Column(String(200), nullable=False)
    content_notification = Column(Text,        nullable=False)
    notification_type    = Column(String(30),  nullable=False)
    is_read              = Column(Boolean,     nullable=False, default=False)
    created_notification = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    user = relationship("User", back_populates="notifications")