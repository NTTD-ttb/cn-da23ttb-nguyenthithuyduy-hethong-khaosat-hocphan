"""Router Số liệu Dashboard — Admin."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    DashboardProgressChartResponse,
    DashboardFeedbackSummaryResponse,
)
from app.services import dashboard_service

router = APIRouter(prefix="/admin/dashboard", tags=["Admin - Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Thống kê số liệu tổng quan")
def get_overview(
    campaign_id: int | None = Query(None, description="ID đợt khảo sát (để trống sẽ lấy đợt mới nhất)"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return dashboard_service.get_dashboard_overview(db, campaign_id)


@router.get("/survey-progress", response_model=DashboardProgressChartResponse, summary="Dữ liệu tiến độ khảo sát theo khoa (vẽ biểu đồ)")
def get_progress_chart(
    campaign_id: int | None = Query(None, description="ID đợt khảo sát"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return dashboard_service.get_dashboard_progress_chart(db, campaign_id)


@router.get("/feedback-summary", response_model=DashboardFeedbackSummaryResponse, summary="Tổng hợp số lượng phản hồi theo môn học")
def get_feedback_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return dashboard_service.get_dashboard_feedback_summary(db)