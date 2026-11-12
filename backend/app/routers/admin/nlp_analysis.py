"""Router Quản lý & Thống kê Phân tích NLP — Dành cho Admin."""

from typing import Any
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.nlp import FeedbackAnalysis, FeedbackTopic, SentimentLabel, TopicLabel
from app.models.survey import SurveyAnswer, SurveyResponse, SurveyAssignment, SurveyCampaign
from app.models.import_batch import CourseEnrollment
from app.models.course import CourseSection, Course
from app.models.lecturer import Lecturer
from app.nlp.pipeline import analyze_campaign_feedbacks

router = APIRouter(prefix="/admin/nlp", tags=["Admin - Phân tích NLP Thông minh"])


# --- SCHEMAS CHO RESPONSE ---
class BatchAnalyzeResponse(BaseModel):
    message: str
    campaign_id: int
    total_unprocessed: int
    successfully_processed: int


class SentimentStatItem(BaseModel):
    sentiment_code: str
    sentiment_name: str
    count: int
    percentage: float


class SentimentStatsResponse(BaseModel):
    total_analyzed: int
    details: list[SentimentStatItem]


class TopicStatItem(BaseModel):
    topic_code: str
    topic_name: str
    count: int
    percentage: float


class TopicStatsResponse(BaseModel):
    total_feedbacks: int
    details: list[TopicStatItem]


class FeedbackDetailItem(BaseModel):
    analysis_id: int
    original_text: str
    cleaned_text: str | None
    sentiment: str
    sentiment_confidence: float | None
    topics: list[str]
    course_name: str
    lecturer_name: str


# --- 1. API KÍCH HOẠT PHÂN TÍCH HÀNG LOẠT ---
@router.post(
    "/batch-analyze/{campaign_id}",
    response_model=BatchAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Kích hoạt phân tích tự động toàn bộ phản hồi văn bản của một đợt khảo sát",
)
def run_batch_analyze(
    campaign_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    campaign = db.get(SurveyCampaign, campaign_id)
    if not campaign:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đợt khảo sát không tồn tại.")

    stats_res = analyze_campaign_feedbacks(db, campaign_id)

    return BatchAnalyzeResponse(
        message="Quá trình phân tích NLP hoàn tất!",
        campaign_id=campaign_id,
        total_unprocessed=stats_res["total_unprocessed"],
        successfully_processed=stats_res["successfully_processed"],
    )


# --- 2. API THỐNG KÊ CẢM XÚC (VẼ BIỂU ĐỒ TRÒN) ---
@router.get(
    "/sentiment-stats",
    response_model=SentimentStatsResponse,
    summary="Thống kê tỷ lệ cảm xúc (Tích cực, Trung tính, Tiêu cực)",
)
def get_sentiment_stats(
    campaign_id: int | None = Query(None, description="Lọc theo đợt khảo sát"),
    course_id: int | None = Query(None, description="Lọc theo học phần"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = (
        db.query(SentimentLabel.sentiment_code, SentimentLabel.sentiment_name, func.count(FeedbackAnalysis.analysis_id))
        .join(FeedbackAnalysis, SentimentLabel.sentiment_id == FeedbackAnalysis.sentiment_id)
        .join(SurveyAnswer, FeedbackAnalysis.answer_id == SurveyAnswer.answer_id)
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
    )

    if campaign_id:
        query = query.filter(SurveyAssignment.campaign_id == campaign_id)
    if course_id:
        query = (
            query.join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
            .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
            .filter(CourseSection.course_id == course_id)
        )

    results = query.group_by(SentimentLabel.sentiment_code, SentimentLabel.sentiment_name).all()

    total = sum(r[2] for r in results)
    details: list[SentimentStatItem] = []

    for r in results:
        code, name, count = r
        pct = round((count / total * 100), 2) if total > 0 else 0.0
        details.append(SentimentStatItem(sentiment_code=code, sentiment_name=name, count=count, percentage=pct))

    return SentimentStatsResponse(total_analyzed=total, details=details)


# --- 3. API THỐNG KÊ CHỦ ĐỀ (VẼ BIỂU ĐỒ CỘT) ---
@router.get(
    "/topic-stats",
    response_model=TopicStatsResponse,
    summary="Thống kê tần suất phân bố 7 chủ đề đào tạo",
)
def get_topic_stats(
    campaign_id: int | None = Query(None, description="Lọc theo đợt khảo sát"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = (
        db.query(TopicLabel.topic_code, TopicLabel.topic_name, func.count(FeedbackTopic.analysis_id))
        .join(FeedbackTopic, TopicLabel.topic_id == FeedbackTopic.topic_id)
        .join(FeedbackAnalysis, FeedbackTopic.analysis_id == FeedbackAnalysis.analysis_id)
        .join(SurveyAnswer, FeedbackAnalysis.answer_id == SurveyAnswer.answer_id)
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
    )

    if campaign_id:
        query = query.filter(SurveyAssignment.campaign_id == campaign_id)

    results = query.group_by(TopicLabel.topic_code, TopicLabel.topic_name).all()
    total_mentions = sum(r[2] for r in results)
    details: list[TopicStatItem] = []

    for r in results:
        code, name, count = r
        pct = round((count / total_mentions * 100), 2) if total_mentions > 0 else 0.0
        details.append(TopicStatItem(topic_code=code, topic_name=name, count=count, percentage=pct))

    return TopicStatsResponse(total_feedbacks=total_mentions, details=details)


# --- 4. API DANH SÁCH PHẢN HỒI VĂN BẢN (ẨN DANH SINH VIÊN) ---
@router.get(
    "/feedback-list",
    response_model=list[FeedbackDetailItem],
    summary="Xem danh sách chi tiết các nhận xét và kết quả AI dự đoán (ẩn danh)",
)
def get_feedback_list(
    campaign_id: int | None = Query(None, description="Lọc theo đợt khảo sát"),
    sentiment: str | None = Query(None, description="Lọc theo cảm xúc: 'positive', 'negative', 'neutral'"),
    topic: str | None = Query(None, description="Lọc theo mã chủ đề: 'teaching', 'material'..."),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = (
        db.query(
            FeedbackAnalysis,
            SurveyAnswer.answer_text,
            SentimentLabel.sentiment_name,
            Course.course_name,
            Lecturer.full_name.label("lecturer_name"),
        )
        .join(SurveyAnswer, FeedbackAnalysis.answer_id == SurveyAnswer.answer_id)
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .outerjoin(SentimentLabel, FeedbackAnalysis.sentiment_id == SentimentLabel.sentiment_id)
    )

    if campaign_id:
        query = query.filter(SurveyAssignment.campaign_id == campaign_id)
    if sentiment:
        query = query.filter(SentimentLabel.sentiment_code == sentiment)
    if topic:
        query = (
            query.join(FeedbackTopic, FeedbackAnalysis.analysis_id == FeedbackTopic.analysis_id)
            .join(TopicLabel, FeedbackTopic.topic_id == TopicLabel.topic_id)
            .filter(TopicLabel.topic_code == topic)
        )

    rows = query.offset(skip).limit(limit).all()
    items: list[FeedbackDetailItem] = []

    for row in rows:
        analysis, original_text, sentiment_name, course_name, lecturer_name = row
        # Lấy danh sách các topic của analysis này
        topics = (
            db.query(TopicLabel.topic_name)
            .join(FeedbackTopic, TopicLabel.topic_id == FeedbackTopic.topic_id)
            .filter(FeedbackTopic.analysis_id == analysis.analysis_id)
            .all()
        )
        topic_names = [t[0] for t in topics]

        items.append(
            FeedbackDetailItem(
                analysis_id=analysis.analysis_id,
                original_text=original_text,
                cleaned_text=analysis.cleaned_text,
                sentiment=sentiment_name or "Chưa xác định",
                sentiment_confidence=float(analysis.sentiment_confidence) if analysis.sentiment_confidence is not None else None,
                topics=topic_names,
                course_name=course_name,
                lecturer_name=lecturer_name,
            )
        )

    return items