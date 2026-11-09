"""Pydantic schemas cho API quản lý Giảng viên."""

from pydantic import BaseModel, ConfigDict, Field


class LecturerBase(BaseModel):
    lecturer_code: str = Field(..., max_length=20, description="Mã giảng viên từ dữ liệu đào tạo")
    full_name: str = Field(..., max_length=150, description="Họ và tên giảng viên")
    email: str | None = Field(None, max_length=255, description="Email giảng viên")
    phone: str | None = Field(None, max_length=20, description="Số điện thoại")
    faculty_id: int | None = Field(None, description="ID khoa giảng viên thuộc về")


class LecturerCreate(LecturerBase):
    """Dùng cho POST /admin/lecturers — tạo giảng viên mới."""
    pass


class LecturerUpdate(BaseModel):
    """Dùng cho PUT /admin/lecturers/{id} — cập nhật thông tin giảng viên."""
    lecturer_code: str | None = Field(None, max_length=20)
    full_name: str | None = Field(None, max_length=150)
    email: str | None = None
    phone: str | None = None
    faculty_id: int | None = None


class LecturerResponse(LecturerBase):
    """Dùng cho GET — trả về dữ liệu giảng viên."""
    lecturer_id: int

    model_config = ConfigDict(from_attributes=True)