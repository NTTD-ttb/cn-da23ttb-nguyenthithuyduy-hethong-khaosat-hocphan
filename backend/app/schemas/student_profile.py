"""Pydantic schemas cho Hồ sơ sinh viên và Đổi mật khẩu."""

from datetime import date
from pydantic import BaseModel, ConfigDict, Field


# --- XEM HỒ SƠ SINH VIÊN ---
class StudentProfileResponse(BaseModel):
    student_id: int
    student_code: str
    full_name: str
    email: str
    class_id: int | None = None
    class_code: str | None = None
    class_name: str | None = None
    faculty_name: str | None = None
    date_of_birth: date | None = None
    phone_student: str | None = None
    gender_student: str | None = None
    avatar_url: str | None = None
    address_student: str | None = None

    model_config = ConfigDict(from_attributes=True)


# --- CẬP NHẬT HỒ SƠ SINH VIÊN ---
# Sinh viên chỉ được phép chỉnh sửa các thông tin liên lạc cá nhân,
# KHÔNG được tự ý sửa MSSV, Họ tên hoặc Lớp hành chính.
class StudentProfileUpdate(BaseModel):
    phone_student: str | None = Field(None, max_length=20, description="Số điện thoại cá nhân")
    gender_student: str | None = Field(None, max_length=20, description="Giới tính: Nam, Nữ, Khác")
    date_of_birth: date | None = Field(None, description="Ngày sinh (YYYY-MM-DD)")
    address_student: str | None = Field(None, description="Địa chỉ liên hệ hiện tại")
    avatar_url: str | None = Field(None, description="Đường dẫn ảnh đại diện")


# --- ĐỔI MẬT KHẨU TÀI KHOẢN ---
class StudentChangePassword(BaseModel):
    old_password: str = Field(..., min_length=6, description="Mật khẩu hiện tại")
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới")
    confirm_password: str = Field(..., min_length=6, description="Xác nhận lại mật khẩu mới")