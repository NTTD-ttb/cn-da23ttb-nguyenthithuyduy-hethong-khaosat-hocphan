"""Router Theo dõi Tiến độ khảo sát — Admin."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.survey import SurveyProgressItem
from app.services import survey_progress_service

router = APIRouter(prefix="/admin/survey-progress", tags=["Admin - Tiến độ khảo sát"])


@router.get("/", response_model=list[SurveyProgressItem], summary="Tra cứu danh sách tiến độ khảo sát")
def list_progress(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    campaign_id: int | None = Query(None, description="Lọc theo đợt khảo sát"),
    section_id: int | None = Query(None, description="Lọc theo lớp học phần"),
    status: str | None = Query(None, description="'not_started', 'in_progress', 'completed'"),
    search_student: str | None = Query(None, description="Tìm kiếm MSSV hoặc tên sinh viên"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return survey_progress_service.get_survey_progress(
        db, skip, limit, campaign_id, section_id, status, search_student
    )