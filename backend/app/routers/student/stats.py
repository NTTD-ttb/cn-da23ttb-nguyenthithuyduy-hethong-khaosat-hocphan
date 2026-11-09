"""Router Thống kê Khảo sát — Dành cho Sinh viên."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_student
from app.models.user import User
from app.services import student_stats_service
from app.services.student_stats_service import StudentStatsSummaryResponse

router = APIRouter(prefix="/student/stats", tags=["Sinh viên - Thống kê cá nhân"])


@router.get(
    "/summary",
    response_model=StudentStatsSummaryResponse,
    summary="Thống kê tiến độ khảo sát của sinh viên theo các học kỳ",
)
def get_stats_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_stats_service.get_student_survey_stats(db, current_user.user_id)