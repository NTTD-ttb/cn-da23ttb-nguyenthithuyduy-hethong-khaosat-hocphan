"""Router CRUD cho Lớp sinh viên — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.student_class import StudentClassCreate, StudentClassResponse, StudentClassUpdate
from app.services import student_class_service

router = APIRouter(prefix="/admin/student-classes", tags=["Admin - Lớp sinh viên"])


@router.get("/", response_model=list[StudentClassResponse], summary="Danh sách lớp sinh viên")
def list_classes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return student_class_service.get_all_classes(db, skip, limit)


@router.get("/{class_id}", response_model=StudentClassResponse, summary="Chi tiết lớp sinh viên")
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return student_class_service.get_class_by_id(db, class_id)


@router.post("/", response_model=StudentClassResponse, status_code=status.HTTP_201_CREATED, summary="Tạo lớp mới")
def create_class(
    body: StudentClassCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return student_class_service.create_class(db, body)


@router.put("/{class_id}", response_model=StudentClassResponse, summary="Cập nhật lớp sinh viên")
def update_class(
    class_id: int,
    body: StudentClassUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return student_class_service.update_class(db, class_id, body)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa lớp sinh viên")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    student_class_service.delete_class(db, class_id)