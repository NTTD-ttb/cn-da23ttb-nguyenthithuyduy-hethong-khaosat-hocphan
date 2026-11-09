"""Nghiệp vụ Thống kê Khảo sát của Sinh viên — Tầng Service."""

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.survey import SurveyAssignment, SurveyCampaign
from app.models.import_batch import CourseEnrollment
from app.models.academic_term import AcademicTerm


class TermSurveyStat(BaseModel):
    term_id: int
    term_name: str
    academic_year: str
    total_assigned: int
    completed: int
    pending: int
    completion_rate: float


class StudentStatsSummaryResponse(BaseModel):
    total_courses: int
    total_completed: int
    overall_rate: float
    by_terms: list[TermSurveyStat]


def get_student_survey_stats(db: Session, student_id: int) -> StudentStatsSummaryResponse:
    """Thống kê tiến độ khảo sát của sinh viên theo từng học kỳ."""
    # Lấy toàn bộ phân công của sinh viên
    enrollments = (
        db.query(SurveyAssignment, AcademicTerm)
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(SurveyCampaign, SurveyAssignment.campaign_id == SurveyCampaign.campaign_id)
        .join(AcademicTerm, SurveyCampaign.term_id == AcademicTerm.term_id)
        .filter(CourseEnrollment.student_id == student_id)
        .all()
    )

    terms_dict: dict[int, dict] = {}
    total_all = len(enrollments)
    completed_all = 0

    for assignment, term in enrollments:
        if term.term_id not in terms_dict:
            terms_dict[term.term_id] = {
                "term_name": term.term_name,
                "academic_year": term.academic_year,
                "total": 0,
                "completed": 0,
            }
        terms_dict[term.term_id]["total"] += 1
        if assignment.status_survey_assignment == "completed":
            terms_dict[term.term_id]["completed"] += 1
            completed_all += 1

    by_terms: list[TermSurveyStat] = []
    for term_id, val in terms_dict.items():
        rate = round((val["completed"] / val["total"] * 100), 2) if val["total"] > 0 else 0.0
        by_terms.append(
            TermSurveyStat(
                term_id=term_id,
                term_name=val["term_name"],
                academic_year=val["academic_year"],
                total_assigned=val["total"],
                completed=val["completed"],
                pending=val["total"] - val["completed"],
                completion_rate=rate,
            )
        )

    overall_rate = round((completed_all / total_all * 100), 2) if total_all > 0 else 0.0

    return StudentStatsSummaryResponse(
        total_courses=total_all,
        total_completed=completed_all,
        overall_rate=overall_rate,
        by_terms=by_terms,
    )