"""Pydantic schemas cho Thông báo hệ thống."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NotificationBase(BaseModel):
    user_id: int | None = Field(None, description="ID người nhận cụ thể. Nếu để trống là thông báo chung toàn trường")
    title: str = Field(..., max_length=200, description="Tiêu đề thông báo")
    content_notification: str = Field(..., description="Nội dung chi tiết thông báo")
    notification_type: str = Field("survey", description="'survey', 'deadline', 'support', 'general'")


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: str | None = None
    content_notification: str | None = None
    notification_type: str | None = None


class NotificationResponse(NotificationBase):
    notification_id: int
    is_read: bool
    created_notification: datetime

    model_config = ConfigDict(from_attributes=True)