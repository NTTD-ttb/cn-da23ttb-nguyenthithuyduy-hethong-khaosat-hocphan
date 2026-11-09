"""Router Quản lý Đợt khảo sát — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.survey import (
    SurveyCampaignCreate,
    SurveyCampaignResponse,
    SurveyCampaignUpdateStatus,
)
from app.services import survey_campaign_service

router = APIRouter(prefix="/admin/survey-campaigns", tags=["Admin - Đợt khảo sát"])


@router.get("/", response_model=list[SurveyCampaignResponse], summary="Danh sách đợt khảo sát")
def list_campaigns(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_campaign_service.get_all_campaigns(db, skip, limit)


@router.get("/{campaign_id}", response_model=SurveyCampaignResponse, summary="Chi tiết đợt khảo sát")
def get_campaign(campaign_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_campaign_service.get_campaign_by_id(db, campaign_id)


@router.post("/", response_model=SurveyCampaignResponse, status_code=status.HTTP_201_CREATED, summary="Tạo đợt khảo sát mới")
def create_campaign(body: SurveyCampaignCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return survey_campaign_service.create_campaign(db, body, admin.user_id)


@router.patch("/{campaign_id}/status", response_model=SurveyCampaignResponse, summary="Đổi trạng thái đợt khảo sát (Tự động sinh lượt làm bài nếu chuyển sang 'open')")
def update_status(campaign_id: int, body: SurveyCampaignUpdateStatus, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_campaign_service.update_campaign_status(db, campaign_id, body)