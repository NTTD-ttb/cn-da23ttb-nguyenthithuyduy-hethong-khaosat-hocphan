"""Khai báo model ORM (SQLAlchemy) cho các bảng trong CSDL.

Khi thêm model mới, nên import lại tại đây để Alembic và các công cụ khác
nhìn thấy đầy đủ metadata của toàn bộ bảng.
"""

from app.models.user         import User
from app.models.faculty      import Faculty
from app.models.student      import StudentClass, StudentProfile
from app.models.lecturer     import Lecturer
from app.models.course       import Course, CourseSection
from app.models.academic_term import AcademicTerm
from app.models.import_batch import ImportBatch, CourseEnrollment
from app.models.survey       import (
    SurveyTemplate,
    SurveyCampaign,
    SurveyQuestion,
    SurveyAssignment,
    SurveyResponse,
    SurveyAnswer,
)
from app.models.nlp          import SentimentLabel, TopicLabel, FeedbackAnalysis, FeedbackTopic
from app.models.contact      import ContactRequest
from app.models.notification import Notification

__all__ = [
    "User",
    "Faculty",
    "StudentClass", "StudentProfile",
    "Lecturer",
    "Course", "CourseSection",
    "AcademicTerm",
    "ImportBatch", "CourseEnrollment",
    "SurveyTemplate", "SurveyCampaign", "SurveyQuestion",
    "SurveyAssignment", "SurveyResponse", "SurveyAnswer",
    "SentimentLabel", "TopicLabel", "FeedbackAnalysis", "FeedbackTopic",
    "ContactRequest",
    "Notification",
]