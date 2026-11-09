"""Router Quản lý Thông báo — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
)
from app.services import notification_service

router = APIRouter(prefix="/admin/notifications", tags=["Admin - Thông báo"])


@router.get("/", response_model=list[NotificationResponse], summary="Danh sách thông báo đã phát")
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return notification_service.get_all_notifications(db, skip, limit)


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED, summary="Tạo thông báo mới (chung hoặc cá nhân)")
def create_notification(
    body: NotificationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return notification_service.create_notification(db, body)


@router.put("/{notification_id}", response_model=NotificationResponse, summary="Sửa thông báo")
def update_notification(
    notification_id: int,
    body: NotificationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return notification_service.update_notification(db, notification_id, body)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa thông báo")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    notification_service.delete_notification(db, notification_id)