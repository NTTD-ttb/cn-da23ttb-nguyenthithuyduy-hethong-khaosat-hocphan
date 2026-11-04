"""Model ORM cho bảng academic_terms — học kỳ/năm học."""

from sqlalchemy import BigInteger, Column, Date, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class AcademicTerm(Base):
    __tablename__ = "academic_terms"

    term_id       = Column(BigInteger, primary_key=True, autoincrement=True)
    term_code     = Column(String(30), nullable=False, unique=True)
    term_name     = Column(String(50), nullable=False)
    academic_year = Column(String(9),  nullable=False)
    start_date    = Column(Date)
    end_date      = Column(Date)

    # Quan hệ
    course_sections  = relationship("CourseSection",   back_populates="term")
    import_batch     = relationship("ImportBatch",     back_populates="term", uselist=False)
    survey_template  = relationship("SurveyTemplate",  back_populates="term", uselist=False)
    survey_campaign  = relationship("SurveyCampaign",  back_populates="term", uselist=False)