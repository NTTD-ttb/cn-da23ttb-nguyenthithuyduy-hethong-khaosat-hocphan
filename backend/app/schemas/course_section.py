"""Pydantic schemas cho API quản lý Lớp học phần."""

from pydantic import BaseModel, ConfigDict, Field


class CourseSectionBase(BaseModel):
    section_code: str = Field(..., max_length=30, description="Mã lớp học phần")
    course_id:    int = Field(..., description="ID học phần")
    lecturer_id:  int = Field(..., description="ID giảng viên phụ trách")
    term_id:      int = Field(..., description="ID học kỳ")


class CourseSectionCreate(CourseSectionBase):
    """Dùng cho POST — tạo lớp học phần mới."""
    pass


class CourseSectionUpdate(BaseModel):
    """Dùng cho PUT — cập nhật lớp học phần (tất cả tùy chọn)."""
    section_code: str | None = Field(None, max_length=30)
    course_id:    int | None = None
    lecturer_id:  int | None = None
    term_id:      int | None = None


class CourseSectionResponse(CourseSectionBase):
    """Dùng cho GET — trả về kèm tên học phần, giảng viên, học kỳ."""
    section_id:   int
    # Các trường bổ sung để frontend hiển thị (không cần gọi thêm API)
    course_name:   str | None = None
    lecturer_name: str | None = None
    term_name:     str | None = None
    academic_year: str | None = None

    model_config = ConfigDict(from_attributes=True)