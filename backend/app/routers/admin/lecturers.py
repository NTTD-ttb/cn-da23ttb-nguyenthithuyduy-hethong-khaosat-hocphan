"""Router CRUD cho Giảng viên — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.lecturer import LecturerCreate, LecturerResponse, LecturerUpdate
from app.services import lecturer_service

router = APIRouter(prefix="/admin/lecturers", tags=["Admin - Giảng viên"])


@router.get("/", response_model=list[LecturerResponse], summary="Danh sách giảng viên")
def list_lecturers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return lecturer_service.get_all_lecturers(db, skip, limit)


@router.get("/{lecturer_id}", response_model=LecturerResponse, summary="Chi tiết giảng viên")
def get_lecturer(
    lecturer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return lecturer_service.get_lecturer_by_id(db, lecturer_id)


@router.post("/", response_model=LecturerResponse, status_code=status.HTTP_201_CREATED, summary="Tạo giảng viên mới")
def create_lecturer(
    body: LecturerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return lecturer_service.create_lecturer(db, body)


@router.put("/{lecturer_id}", response_model=LecturerResponse, summary="Cập nhật giảng viên")
def update_lecturer(
    lecturer_id: int,
    body: LecturerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return lecturer_service.update_lecturer(db, lecturer_id, body)


@router.delete("/{lecturer_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa giảng viên")
def delete_lecturer(
    lecturer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lecturer_service.delete_lecturer(db, lecturer_id)