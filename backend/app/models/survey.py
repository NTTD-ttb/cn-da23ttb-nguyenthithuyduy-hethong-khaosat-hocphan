"""Model ORM cho các bảng khảo sát:
survey_templates, survey_campaigns, survey_questions,
survey_assignments, survey_responses, survey_answers.
"""

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, ForeignKey,
    Integer, JSON, Numeric, SmallInteger, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SurveyTemplate(Base):
    __tablename__ = "survey_templates"

    template_id              = Column(BigInteger, primary_key=True, autoincrement=True)
    template_name            = Column(String(200), nullable=False)
    term_id                  = Column(BigInteger, ForeignKey("academic_terms.term_id"), nullable=False, unique=True)
    version_number           = Column(Integer,    nullable=False, default=1)
    status_survey_template   = Column(String(20), nullable=False, default="draft")
    created_by               = Column(BigInteger, ForeignKey("users.user_id"))
    created_survey_templates = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    term      = relationship("AcademicTerm", back_populates="survey_template")
    creator   = relationship("User",         foreign_keys=[created_by])
    questions = relationship("SurveyQuestion", back_populates="template")
    campaigns = relationship("SurveyCampaign", back_populates="template")


class SurveyCampaign(Base):
    __tablename__ = "survey_campaigns"

    campaign_id              = Column(BigInteger, primary_key=True, autoincrement=True)
    term_id                  = Column(BigInteger, ForeignKey("academic_terms.term_id"),    nullable=False, unique=True)
    template_id              = Column(BigInteger, ForeignKey("survey_templates.template_id"), nullable=False)
    campaign_name            = Column(String(200), nullable=False)
    start_survey_campaigns   = Column(DateTime(timezone=True), nullable=False)
    end_survey_campaigns     = Column(DateTime(timezone=True), nullable=False)
    status                   = Column(String(20),  nullable=False, default="draft")
    created_by               = Column(BigInteger, ForeignKey("users.user_id"))
    created_survey_campaigns = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    term        = relationship("AcademicTerm",    back_populates="survey_campaign")
    template    = relationship("SurveyTemplate",  back_populates="campaigns")
    creator     = relationship("User",            foreign_keys=[created_by])
    assignments = relationship("SurveyAssignment", back_populates="campaign")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    question_id      = Column(BigInteger, primary_key=True, autoincrement=True)
    template_id      = Column(BigInteger, ForeignKey("survey_templates.template_id"), nullable=False)
    question_code    = Column(String(30),  nullable=False, unique=True)
    question_text    = Column(Text,        nullable=False)
    question_type    = Column(String(30),  nullable=False)
    topic_id         = Column(BigInteger, ForeignKey("topic_labels.topic_id"))
    is_required      = Column(Boolean,    nullable=False, default=True)
    display_order    = Column(Integer,    nullable=False)
    options_json     = Column(JSON)
    min_value        = Column(Numeric(5, 2))
    max_value        = Column(Numeric(5, 2))
    created_question = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Quan hệ
    template = relationship("SurveyTemplate", back_populates="questions")
    topic    = relationship("TopicLabel",     back_populates="questions")
    answers  = relationship("SurveyAnswer",   back_populates="question")


class SurveyAssignment(Base):
    __tablename__ = "survey_assignments"

    __table_args__ = (
        UniqueConstraint("campaign_id", "enrollment_id", name="uq_assignment_campaign_enrollment"),
    )

    assignment_id               = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id                 = Column(BigInteger, ForeignKey("survey_campaigns.campaign_id"),    nullable=False)
    enrollment_id               = Column(BigInteger, ForeignKey("course_enrollments.enrollment_id"), nullable=False)
    status_survey_assignment    = Column(String(20), nullable=False, default="not_started")
    assigned_survey_assignment  = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_survey_assignment = Column(DateTime(timezone=True))

    # Quan hệ
    campaign   = relationship("SurveyCampaign",   back_populates="assignments")
    enrollment = relationship("CourseEnrollment", back_populates="assignments")
    response   = relationship("SurveyResponse",   back_populates="assignment", uselist=False)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    response_id                = Column(BigInteger, primary_key=True, autoincrement=True)
    assignment_id              = Column(BigInteger, ForeignKey("survey_assignments.assignment_id"), nullable=False, unique=True)
    response_status            = Column(String(20), nullable=False, default="draft")
    started_survey_response    = Column(DateTime(timezone=True))
    last_saved_survey_response = Column(DateTime(timezone=True))
    submitted_survey_response  = Column(DateTime(timezone=True))
    created_survey_response    = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_survey_response    = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Quan hệ
    assignment = relationship("SurveyAssignment", back_populates="response")
    answers    = relationship("SurveyAnswer",     back_populates="response")


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_answer_response_question"),
    )

    answer_id            = Column(BigInteger, primary_key=True, autoincrement=True)
    response_id          = Column(BigInteger, ForeignKey("survey_responses.response_id"),  nullable=False)
    question_id          = Column(BigInteger, ForeignKey("survey_questions.question_id"),  nullable=False)
    answer_text          = Column(Text)
    answer_number        = Column(Numeric(6, 2))
    answer_json          = Column(JSON)
    created_survey_answer = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_survey_answer = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Quan hệ
    response  = relationship("SurveyResponse",  back_populates="answers")
    question  = relationship("SurveyQuestion",  back_populates="answers")
    analysis  = relationship("FeedbackAnalysis", back_populates="answer", uselist=False)