"""Model ORM cho bảng lecturers — danh mục giảng viên."""

from sqlalchemy import BigInteger, Column, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Lecturer(Base):
    __tablename__ = "lecturers"

    lecturer_id   = Column(BigInteger, primary_key=True, autoincrement=True)
    lecturer_code = Column(String(20),  nullable=False, unique=True)
    full_name     = Column(String(150), nullable=False)
    email         = Column(String(255), unique=True)
    phone         = Column(String(20))
    faculty_id    = Column(BigInteger, ForeignKey("faculties.faculty_id"))

    # Quan hệ
    faculty          = relationship("Faculty",       back_populates="lecturers")
    course_sections  = relationship("CourseSection", back_populates="lecturer")