"""Pydantic schemas cho API quản lý Khoa."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FacultyBase(BaseModel):
    faculty_code: str = Field(..., max_length=20,  description="Mã khoa, ví dụ: CNTT")
    faculty_name: str = Field(..., max_length=150, description="Tên khoa đầy đủ")
    description:  str | None = Field(None, description="Mô tả thêm về khoa")
    status:       str = Field("active", description="active hoặc inactive")


class FacultyCreate(FacultyBase):
    """Dùng cho POST /admin/faculties — tạo khoa mới."""
    pass


class FacultyUpdate(BaseModel):
    """Dùng cho PUT /admin/faculties/{id} — cập nhật khoa (tất cả trường tùy chọn)."""
    faculty_code: str | None = Field(None, max_length=20)
    faculty_name: str | None = Field(None, max_length=150)
    description:  str | None = None
    status:       str | None = None


class FacultyResponse(FacultyBase):
    """Dùng cho GET — trả về dữ liệu khoa."""
    faculty_id:      int
    created_faculty: datetime

    model_config = ConfigDict(from_attributes=True)