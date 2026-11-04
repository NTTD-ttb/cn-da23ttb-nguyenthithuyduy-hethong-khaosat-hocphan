"""Model ORM cho bảng courses và course_sections."""

from sqlalchemy import BigInteger, Column, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Course(Base):
    __tablename__ = "courses"

    course_id   = Column(BigInteger, primary_key=True, autoincrement=True)
    course_code = Column(String(30),  nullable=False, unique=True)
    course_name = Column(String(200), nullable=False)
    description = Column(Text)

    # Quan hệ
    sections = relationship("CourseSection", back_populates="course")


class CourseSection(Base):
    __tablename__ = "course_sections"

    __table_args__ = (
        UniqueConstraint("section_code", "term_id", name="uq_section_code_term"),
    )

    section_id   = Column(BigInteger, primary_key=True, autoincrement=True)
    section_code = Column(String(30),  nullable=False)
    course_id    = Column(BigInteger, ForeignKey("courses.course_id"),           nullable=False)
    lecturer_id  = Column(BigInteger, ForeignKey("lecturers.lecturer_id"),       nullable=False)
    term_id      = Column(BigInteger, ForeignKey("academic_terms.term_id"),      nullable=False)

    # Quan hệ
    course      = relationship("Course",   back_populates="sections")
    lecturer    = relationship("Lecturer", back_populates="course_sections")
    term        = relationship("AcademicTerm", back_populates="course_sections")
    enrollments = relationship("CourseEnrollment", back_populates="section")