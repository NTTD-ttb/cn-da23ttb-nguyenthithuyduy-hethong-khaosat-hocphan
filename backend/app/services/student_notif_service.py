"""Nghiệp vụ Xem Thông báo của Sinh viên — Tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationResponse


def get_student_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[NotificationResponse]:
    """Lấy danh sách thông báo chung (user_id IS NULL) + thông báo riêng của sinh viên."""
    notifications = (
        db.query(Notification)
        .filter(or_(Notification.user_id == user_id, Notification.user_id.is_(None)))
        .order_by(Notification.created_notification.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [NotificationResponse.model_validate(n) for n in notifications]


def mark_notification_as_read(
    db: Session,
    notification_id: int,
    user_id: int
) -> None:
    """Đánh dấu một thông báo là đã đọc."""
    notif = db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thông báo không tồn tại."
        )

    # Nếu là thông báo riêng của người khác thì không cho sửa
    if notif.user_id is not None and notif.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền sửa thông báo này."
        )

    notif.is_read = True
    db.commit()