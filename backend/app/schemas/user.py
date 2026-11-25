"""Pydantic schemas cho API quản lý người dùng (Users)."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    email: str = Field(..., description="Email đăng nhập của người dùng")
    role: str = Field("student", description="Vai trò: 'student' hoặc 'admin'")
    must_change_password: bool = Field(False, description="Bắt buộc đổi mật khẩu lần đầu")


class UserCreate(UserBase):
    """Dùng khi tạo tài khoản mới — cần mật khẩu ban đầu."""
    password: str = Field(..., min_length=6, description="Mật khẩu khởi tạo")
    student_code: str | None = None
    full_name: str | None = None
    class_id: int | None = None


class UserUpdate(BaseModel):
    """Dùng khi sửa thông tin tài khoản (các trường đều là tùy chọn)."""
    email: str | None = None
    role: str | None = None
    must_change_password: bool | None = None
    student_code: str | None = None
    full_name: str | None = None
    class_id: int | None = None


class UserResetPassword(BaseModel):
    """Dùng khi Admin đặt lại mật khẩu cho người dùng."""
    new_password: str = Field(..., min_length=6, description="Mật khẩu mới do admin đặt")


class StudentClassBrief(BaseModel):
    class_code: str | None = None
    class_name: str | None = None
    model_config = ConfigDict(from_attributes=True)


class StudentProfileBrief(BaseModel):
    student_code: str | None = None
    full_name: str | None = None
    class_id: int | None = None
    student_class: StudentClassBrief | None = None
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """Dữ liệu trả về cho client — KHÔNG bao giờ chứa password_hash."""
    user_id: int
    created_account: datetime
    updated_account: datetime
    student_profile: StudentProfileBrief | None = None

    model_config = ConfigDict(from_attributes=True)