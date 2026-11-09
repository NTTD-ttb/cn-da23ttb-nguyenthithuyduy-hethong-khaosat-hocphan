"""Pydantic schemas cho API quản lý Học phần."""

from pydantic import BaseModel, ConfigDict, Field


class CourseBase(BaseModel):
    course_code: str = Field(..., max_length=30, description="Mã học phần")
    course_name: str = Field(..., max_length=200, description="Tên học phần")
    description: str | None = Field(None, description="Mô tả nội dung học phần")


class CourseCreate(CourseBase):
    """Dùng cho POST /admin/courses — tạo học phần mới."""
    pass


class CourseUpdate(BaseModel):
    """Dùng cho PUT /admin/courses/{id} — cập nhật học phần."""
    course_code: str | None = Field(None, max_length=30)
    course_name: str | None = Field(None, max_length=200)
    description: str | None = None


class CourseResponse(CourseBase):
    """Dùng cho GET — trả về dữ liệu học phần."""
    course_id: int

    model_config = ConfigDict(from_attributes=True)