"""Model ORM cho bảng contact_requests — yêu cầu hỗ trợ."""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    request_id               = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id                  = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    request_type             = Column(String(50),  nullable=False)
    subject                  = Column(String(200))
    content_contact_request  = Column(Text,        nullable=False)
    status_contact_request   = Column(String(30),  nullable=False, default="pending")
    assigned_admin_id        = Column(BigInteger, ForeignKey("users.user_id"))
    admin_note               = Column(Text)
    created_contact_request  = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    resolved_contact_request = Column(DateTime(timezone=True))

    # Quan hệ
    user           = relationship("User", back_populates="contact_requests", foreign_keys=[user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])