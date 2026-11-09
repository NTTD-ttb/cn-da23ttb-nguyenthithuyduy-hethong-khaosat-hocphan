"""Pydantic schemas cho Yêu cầu liên hệ / hỗ trợ của Sinh viên."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class StudentContactCreate(BaseModel):
    request_type: str = Field(
        ..., 
        description="Loại yêu cầu: 'sai_thong_tin', 'khong_thay_hoc_phan', 'loi_lam_bai', 'gop_y', 'khac'"
    )
    subject: str = Field(..., max_length=200, description="Tiêu đề yêu cầu hỗ trợ")
    content_contact_request: str = Field(..., description="Nội dung chi tiết phản ánh")


class StudentContactResponse(BaseModel):
    request_id: int
    request_type: str
    subject: str | None = None
    content_contact_request: str
    status_contact_request: str = Field(..., description="'pending', 'in_progress', 'resolved', 'closed'")
    admin_note: str | None = Field(None, description="Ghi chú phản hồi từ Quản trị viên")
    created_contact_request: datetime
    resolved_contact_request: datetime | None = None

    model_config = ConfigDict(from_attributes=True)