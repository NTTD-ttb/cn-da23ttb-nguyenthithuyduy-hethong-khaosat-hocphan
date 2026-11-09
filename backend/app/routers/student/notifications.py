"""Router Xem Thông báo — Dành cho Sinh viên."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_student
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services import student_notif_service

router = APIRouter(prefix="/student/notifications", tags=["Sinh viên - Thông báo"])


@router.get(
    "/",
    response_model=list[NotificationResponse],
    summary="Xem danh sách thông báo chung và thông báo cá nhân",
)
def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_notif_service.get_student_notifications(db, current_user.user_id, skip, limit)


@router.patch(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Đánh dấu thông báo là đã đọc",
)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student_notif_service.mark_notification_as_read(db, notification_id, current_user.user_id)
    return {"message": "Đã đánh dấu thông báo là đã đọc."}