"""Router Quản lý Hồ sơ & Mật khẩu — Dành cho Sinh viên."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_student
from app.models.user import User
from app.schemas.student_profile import (
    StudentProfileResponse,
    StudentProfileUpdate,
    StudentChangePassword,
)
from app.services import student_profile_service

router = APIRouter(prefix="/student", tags=["Sinh viên - Hồ sơ cá nhân"])


@router.get(
    "/profile",
    response_model=StudentProfileResponse,
    summary="Xem thông tin hồ sơ cá nhân",
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_profile_service.get_student_profile(db, current_user.user_id)


@router.put(
    "/profile",
    response_model=StudentProfileResponse,
    summary="Cập nhật thông tin cá nhân (SĐT, Địa chỉ, Avatar...)",
)
def update_my_profile(
    body: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_profile_service.update_student_profile(db, current_user.user_id, body)


@router.patch(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Đổi mật khẩu tài khoản sinh viên",
)
def change_password(
    body: StudentChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    student_profile_service.change_student_password(db, current_user.user_id, body)
    return {"message": "Đổi mật khẩu thành công!"}