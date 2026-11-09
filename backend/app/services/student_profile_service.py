"""Nghiệp vụ Quản lý Hồ sơ sinh viên & Đổi mật khẩu — Tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.student import StudentProfile, StudentClass
from app.models.faculty import Faculty
from app.schemas.student_profile import (
    StudentProfileResponse,
    StudentProfileUpdate,
    StudentChangePassword,
)
from app.utils.security import verify_password, hash_password


def get_student_profile(db: Session, user_id: int) -> StudentProfileResponse:
    """Lấy thông tin hồ sơ của sinh viên đang đăng nhập kèm thông tin Lớp và Khoa."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại trên hệ thống."
        )

    profile = db.get(StudentProfile, user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chưa tìm thấy thông tin hồ sơ sinh viên."
        )

    # Lấy thông tin lớp và khoa nếu có
    class_code = None
    class_name = None
    faculty_name = None
    if profile.class_id:
        student_class = db.get(StudentClass, profile.class_id)
        if student_class:
            class_code = student_class.class_code
            class_name = student_class.class_name
            faculty = db.get(Faculty, student_class.faculty_id)
            if faculty:
                faculty_name = faculty.faculty_name

    return StudentProfileResponse(
        student_id=profile.student_id,
        student_code=profile.student_code,
        full_name=profile.full_name,
        email=user.email,
        class_id=profile.class_id,
        class_code=class_code,
        class_name=class_name,
        faculty_name=faculty_name,
        date_of_birth=profile.date_of_birth,
        phone_student=profile.phone_student,
        gender_student=profile.gender_student,
        avatar_url=profile.avatar_url,
        address_student=profile.address_student,
    )


def update_student_profile(
    db: Session,
    user_id: int,
    data: StudentProfileUpdate
) -> StudentProfileResponse:
    """Cập nhật các thông tin cá nhân được phép chỉnh sửa."""
    profile = db.get(StudentProfile, user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy hồ sơ sinh viên."
        )

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return get_student_profile(db, user_id)


def change_student_password(
    db: Session,
    user_id: int,
    data: StudentChangePassword
) -> None:
    """Đổi mật khẩu tài khoản sinh viên."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản không tồn tại."
        )

    # 1. Kiểm tra mật khẩu cũ
    if not verify_password(data.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác."
        )

    # 2. Kiểm tra xác nhận mật khẩu mới
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới và xác nhận mật khẩu không khớp."
        )

    # 3. Băm mật khẩu mới và bỏ cờ bắt buộc đổi pass
    user.password_hash = hash_password(data.new_password)
    user.must_change_password = False
    db.commit()