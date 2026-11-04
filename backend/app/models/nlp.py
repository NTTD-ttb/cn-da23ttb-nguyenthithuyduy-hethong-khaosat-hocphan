"""Model ORM cho các bảng NLP:
sentiment_labels, topic_labels, feedback_analyses, feedback_topics.
"""

from sqlalchemy import (
    BigInteger, Column, DateTime, ForeignKey,
    Numeric, SmallInteger, String, Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SentimentLabel(Base):
    __tablename__ = "sentiment_labels"

    sentiment_id   = Column(SmallInteger, primary_key=True, autoincrement=True)
    sentiment_code = Column(String(20),   nullable=False, unique=True)
    sentiment_name = Column(String(50),   nullable=False)
    description    = Column(Text)

    # Quan hệ
    analyses = relationship("FeedbackAnalysis", back_populates="sentiment")


class TopicLabel(Base):
    __tablename__ = "topic_labels"

    topic_id    = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_code  = Column(String(30),  nullable=False, unique=True)
    topic_name  = Column(String(100), nullable=False)
    description = Column(Text)
    status_topic = Column(String(20), nullable=False, default="active")

    # Quan hệ
    questions       = relationship("SurveyQuestion",  back_populates="topic")
    feedback_topics = relationship("FeedbackTopic",   back_populates="topic")


class FeedbackAnalysis(Base):
    __tablename__ = "feedback_analyses"

    analysis_id          = Column(BigInteger,  primary_key=True, autoincrement=True)
    answer_id            = Column(BigInteger,  ForeignKey("survey_answers.answer_id"), nullable=False, unique=True)
    cleaned_text         = Column(Text)
    sentiment_id         = Column(SmallInteger, ForeignKey("sentiment_labels.sentiment_id"))
    sentiment_confidence = Column(Numeric(5, 4))
    model_version        = Column(String(100))

    # Quan hệ
    answer          = relationship("SurveyAnswer",   back_populates="analysis")
    sentiment       = relationship("SentimentLabel", back_populates="analyses")
    feedback_topics = relationship("FeedbackTopic",  back_populates="analysis")


class FeedbackTopic(Base):
    __tablename__ = "feedback_topics"

    analysis_id      = Column(BigInteger, ForeignKey("feedback_analyses.analysis_id"), primary_key=True)
    topic_id         = Column(BigInteger, ForeignKey("topic_labels.topic_id"),         primary_key=True)
    topic_confidence = Column(Numeric(5, 4))

    # Quan hệ
    analysis = relationship("FeedbackAnalysis", back_populates="feedback_topics")
    topic    = relationship("TopicLabel",       back_populates="feedback_topics")