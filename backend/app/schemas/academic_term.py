"""Pydantic schemas cho API quản lý Học kỳ."""

from datetime import date
from pydantic import BaseModel, ConfigDict, Field


class AcademicTermBase(BaseModel):
    term_code: str = Field(..., max_length=30, description="Mã học kỳ duy nhất")
    term_name: str = Field(..., max_length=50, description="Tên học kỳ, ví dụ: Học kỳ 1")
    academic_year: str = Field(..., max_length=9, description="Năm học, ví dụ: 2024-2025")
    start_date: date | None = Field(None, description="Ngày bắt đầu học kỳ")
    end_date: date | None = Field(None, description="Ngày kết thúc học kỳ")


class AcademicTermCreate(AcademicTermBase):
    """Dùng cho POST /admin/academic-terms — tạo học kỳ mới."""
    pass


class AcademicTermUpdate(BaseModel):
    """Dùng cho PUT /admin/academic-terms/{id} — cập nhật học kỳ."""
    term_code: str | None = Field(None, max_length=30)
    term_name: str | None = Field(None, max_length=50)
    academic_year: str | None = Field(None, max_length=9)
    start_date: date | None = None
    end_date: date | None = None


class AcademicTermResponse(AcademicTermBase):
    """Dùng cho GET — trả về dữ liệu học kỳ."""
    term_id: int

    model_config = ConfigDict(from_attributes=True)