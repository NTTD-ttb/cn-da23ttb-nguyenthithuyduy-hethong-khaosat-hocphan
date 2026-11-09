"""Pydantic schemas cho API quản lý Lớp sinh viên."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class StudentClassBase(BaseModel):
    class_code: str = Field(..., max_length=30, description="Mã lớp hành chính, ví dụ: DA22TTC")
    class_name: str = Field(..., max_length=150, description="Tên đầy đủ của lớp sinh viên")
    faculty_id: int = Field(..., description="ID khoa quản lý lớp")
    status: str = Field("active", description="active hoặc inactive")


class StudentClassCreate(StudentClassBase):
    """Dùng cho POST /admin/student-classes — tạo lớp mới."""
    pass


class StudentClassUpdate(BaseModel):
    """Dùng cho PUT /admin/student-classes/{id} — cập nhật lớp (tất cả trường tùy chọn)."""
    class_code: str | None = Field(None, max_length=30)
    class_name: str | None = Field(None, max_length=150)
    faculty_id: int | None = None
    status: str | None = None


class StudentClassResponse(StudentClassBase):
    """Dùng cho GET — trả về dữ liệu lớp sinh viên."""
    class_id: int
    created_student_classes: datetime

    model_config = ConfigDict(from_attributes=True)