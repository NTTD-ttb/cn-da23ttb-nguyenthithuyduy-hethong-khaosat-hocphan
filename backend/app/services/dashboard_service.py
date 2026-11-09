"""Nghiệp vụ tính toán số liệu Dashboard."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.survey import SurveyAssignment, SurveyCampaign, SurveyAnswer
from app.models.import_batch import CourseEnrollment
from app.models.student import StudentProfile, StudentClass
from app.models.faculty import Faculty
from app.models.course import CourseSection, Course
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardProgressChartResponse,
    ProgressByFaculty,
    DashboardFeedbackSummaryResponse,
    FeedbackSummaryItem,
)


def get_active_campaign(db: Session, campaign_id: int | None = None) -> SurveyCampaign | None:
    if campaign_id:
        return db.get(SurveyCampaign, campaign_id)
    # Lấy đợt đang mở, nếu không có lấy đợt tạo gần nhất
    return (
        db.query(SurveyCampaign)
        .order_by(SurveyCampaign.status == "open", SurveyCampaign.created_survey_campaigns.desc())
        .first()
    )


def get_dashboard_overview(db: Session, campaign_id: int | None = None) -> DashboardOverviewResponse:
    campaign = get_active_campaign(db, campaign_id)
    if not campaign:
        return DashboardOverviewResponse(
            total_assignments=0,
            completed_assignments=0,
            in_progress_assignments=0,
            not_started_assignments=0,
            completion_rate=0.0,
            total_text_feedback=0,
        )

    total = db.query(SurveyAssignment).filter(SurveyAssignment.campaign_id == campaign.campaign_id).count()
    completed = (
        db.query(SurveyAssignment)
        .filter(SurveyAssignment.campaign_id == campaign.campaign_id, SurveyAssignment.status_survey_assignment == "completed")
        .count()
    )
    in_progress = (
        db.query(SurveyAssignment)
        .filter(SurveyAssignment.campaign_id == campaign.campaign_id, SurveyAssignment.status_survey_assignment == "in_progress")
        .count()
    )
    not_started = (
        db.query(SurveyAssignment)
        .filter(SurveyAssignment.campaign_id == campaign.campaign_id, SurveyAssignment.status_survey_assignment == "not_started")
        .count()
    )

    rate = round((completed / total * 100), 2) if total > 0 else 0.0

    # Đếm số nhận xét văn bản
    total_feedback = (
        db.query(SurveyAnswer)
        .filter(SurveyAnswer.answer_text.isnot(None), SurveyAnswer.answer_text != "")
        .count()
    )

    return DashboardOverviewResponse(
        total_assignments=total,
        completed_assignments=completed,
        in_progress_assignments=in_progress,
        not_started_assignments=not_started,
        completion_rate=rate,
        total_text_feedback=total_feedback,
    )


def get_dashboard_progress_chart(db: Session, campaign_id: int | None = None) -> DashboardProgressChartResponse:
    campaign = get_active_campaign(db, campaign_id)
    if not campaign:
        return DashboardProgressChartResponse(campaign_id=0, campaign_name="Chưa có đợt khảo sát", by_faculties=[])

    faculties = db.query(Faculty).all()
    by_faculties: list[ProgressByFaculty] = []

    for fac in faculties:
        # Đếm tổng và hoàn thành theo từng khoa dựa trên lớp hành chính của sinh viên
        q_base = (
            db.query(SurveyAssignment)
            .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
            .join(StudentProfile, CourseEnrollment.student_id == StudentProfile.student_id)
            .join(StudentClass, StudentProfile.class_id == StudentClass.class_id)
            .filter(
                SurveyAssignment.campaign_id == campaign.campaign_id,
                StudentClass.faculty_id == fac.faculty_id,
            )
        )
        total = q_base.count()
        completed = q_base.filter(SurveyAssignment.status_survey_assignment == "completed").count()
        rate = round((completed / total * 100), 2) if total > 0 else 0.0

        by_faculties.append(ProgressByFaculty(faculty_name=fac.faculty_name, total=total, completed=completed, rate=rate))

    return DashboardProgressChartResponse(
        campaign_id=campaign.campaign_id,
        campaign_name=campaign.campaign_name,
        by_faculties=by_faculties,
    )


def get_dashboard_feedback_summary(db: Session) -> DashboardFeedbackSummaryResponse:
    # Đếm số nhận xét text nhóm theo từng môn học
    results = (
        db.query(
            Course.course_code,
            Course.course_name,
            func.count(SurveyAnswer.answer_id).label("total_feedback"),
        )
        .join(CourseSection, Course.course_id == CourseSection.course_id)
        .join(CourseEnrollment, CourseSection.section_id == CourseEnrollment.section_id)
        .join(SurveyAssignment, CourseEnrollment.enrollment_id == SurveyAssignment.enrollment_id)
        .join(SurveyAnswer, SurveyAssignment.assignment_id == SurveyAnswer.response_id)
        .filter(SurveyAnswer.answer_text.isnot(None), SurveyAnswer.answer_text != "")
        .group_by(Course.course_code, Course.course_name)
        .limit(10)
        .all()
    )

    items = [
        FeedbackSummaryItem(course_code=r.course_code, course_name=r.course_name, total_feedback=r.total_feedback)
        for r in results
    ]
    return DashboardFeedbackSummaryResponse(items=items)