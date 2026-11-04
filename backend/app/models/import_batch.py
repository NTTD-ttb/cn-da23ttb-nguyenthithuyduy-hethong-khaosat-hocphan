"""Model ORM cho bảng import_batches và course_enrollments."""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ImportBatch(Base):
    __tablename__ = "import_batches"

    import_batch_id       = Column(BigInteger, primary_key=True, autoincrement=True)
    term_id               = Column(BigInteger, ForeignKey("academic_terms.term_id"), nullable=False, unique=True)
    file_name             = Column(String(255), nullable=False)
    file_type             = Column(String(10),  nullable=False)
    uploaded_by           = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    uploaded_import_batch = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    total_rows            = Column(Integer, nullable=False)
    valid_rows            = Column(Integer, nullable=False)
    error_rows            = Column(Integer, nullable=False)
    file_checksum         = Column(String(128))

    # Quan hệ
    term        = relationship("AcademicTerm",    back_populates="import_batch")
    uploader    = relationship("User",            foreign_keys=[uploaded_by])
    enrollments = relationship("CourseEnrollment", back_populates="import_batch")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    __table_args__ = (
        UniqueConstraint("student_id", "section_id", name="uq_enrollment_student_section"),
    )

    enrollment_id              = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id                 = Column(BigInteger, ForeignKey("student_profiles.student_id"), nullable=False)
    section_id                 = Column(BigInteger, ForeignKey("course_sections.section_id"),  nullable=False)
    import_batch_id            = Column(BigInteger, ForeignKey("import_batches.import_batch_id"), nullable=False)
    created_course_enrollments = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    student      = relationship("StudentProfile", back_populates="enrollments")
    section      = relationship("CourseSection",  back_populates="enrollments")
    import_batch = relationship("ImportBatch",    back_populates="enrollments")
    assignments  = relationship("SurveyAssignment", back_populates="enrollment")