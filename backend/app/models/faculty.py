"""Model ORM cho bảng faculties — danh mục khoa."""

from sqlalchemy import BigInteger, Column, DateTime, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Faculty(Base):
    __tablename__ = "faculties"

    faculty_id      = Column(BigInteger, primary_key=True, autoincrement=True)
    faculty_code    = Column(String(20),  nullable=False, unique=True)
    faculty_name    = Column(String(150), nullable=False)
    description     = Column(Text)
    status          = Column(String(20),  nullable=False, default="active")
    created_faculty = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    student_classes = relationship("StudentClass", back_populates="faculty")
    lecturers       = relationship("Lecturer",     back_populates="faculty")