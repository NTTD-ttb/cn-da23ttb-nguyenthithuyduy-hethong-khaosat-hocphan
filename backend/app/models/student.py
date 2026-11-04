"""Model ORM cho bảng student_classes và student_profiles."""

from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class StudentClass(Base):
    __tablename__ = "student_classes"

    class_id                = Column(BigInteger, primary_key=True, autoincrement=True)
    class_code              = Column(String(30),  nullable=False, unique=True)
    class_name              = Column(String(150), nullable=False)
    faculty_id              = Column(BigInteger, ForeignKey("faculties.faculty_id"), nullable=False)
    status                  = Column(String(20),  nullable=False, default="active")
    created_student_classes = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    faculty  = relationship("Faculty",         back_populates="student_classes")
    students = relationship("StudentProfile",  back_populates="student_class")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    student_id      = Column(BigInteger, ForeignKey("users.user_id"), primary_key=True)
    student_code    = Column(String(20),  nullable=False, unique=True)
    full_name       = Column(String(150), nullable=False)
    class_id        = Column(BigInteger, ForeignKey("student_classes.class_id"))
    date_of_birth   = Column(Date)
    phone_student   = Column(String(20))
    gender_student  = Column(String(20))
    avatar_url      = Column(Text)
    address_student = Column(Text)

    # Quan hệ
    user          = relationship("User",          back_populates="student_profile")
    student_class = relationship("StudentClass",  back_populates="students")
    enrollments   = relationship("CourseEnrollment", back_populates="student")