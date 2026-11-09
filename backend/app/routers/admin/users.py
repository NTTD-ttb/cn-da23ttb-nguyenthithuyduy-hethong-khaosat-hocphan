"""Router CRUD Người dùng — Dành riêng cho Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate, UserResetPassword
from app.services import user_service

router = APIRouter(prefix="/admin/users", tags=["Admin - Người dùng"])


@router.get("/", response_model=list[UserResponse], summary="Danh sách người dùng")
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    role: str | None = Query(None, description="Lọc theo role ('student' hoặc 'admin')"),
    search: str | None = Query(None, description="Tìm kiếm theo email"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.get_all_users(db, skip, limit, role, search)


@router.get("/{user_id}", response_model=UserResponse, summary="Chi tiết người dùng")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.get_user_by_id(db, user_id)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Tạo người dùng mới")
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.create_user(db, body)


@router.put("/{user_id}", response_model=UserResponse, summary="Cập nhật người dùng")
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.update_user(db, user_id, body)


@router.patch("/{user_id}/reset-password", response_model=UserResponse, summary="Reset mật khẩu người dùng")
def reset_password(
    user_id: int,
    body: UserResetPassword,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return user_service.reset_password(db, user_id, body)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa người dùng")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user_service.delete_user(db, user_id)