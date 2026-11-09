"""Nghiệp vụ Quản lý Thông báo."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate


def get_all_notifications(db: Session, skip: int = 0, limit: int = 100) -> list[Notification]:
    return db.query(Notification).order_by(Notification.created_notification.desc()).offset(skip).limit(limit).all()


def get_notification_by_id(db: Session, notification_id: int) -> Notification:
    notif = db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thông báo ID={notification_id}.")
    return notif


def create_notification(db: Session, data: NotificationCreate) -> Notification:
    if data.user_id is not None:
        user = db.get(User, data.user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Người dùng ID={data.user_id} không tồn tại.")

    notif = Notification(**data.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def update_notification(db: Session, notification_id: int, data: NotificationUpdate) -> Notification:
    notif = get_notification_by_id(db, notification_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(notif, field, value)
    db.commit()
    db.refresh(notif)
    return notif


def delete_notification(db: Session, notification_id: int) -> None:
    notif = get_notification_by_id(db, notification_id)
    db.delete(notif)
    db.commit()