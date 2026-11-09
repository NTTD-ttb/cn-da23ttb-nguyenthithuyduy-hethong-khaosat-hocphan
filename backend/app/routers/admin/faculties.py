"""Router CRUD cho Khoa — chỉ Admin được truy cập."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.faculty import FacultyCreate, FacultyResponse, FacultyUpdate
from app.services import faculty_service

router = APIRouter(prefix="/admin/faculties", tags=["Admin - Khoa"])


@router.get("/", response_model=list[FacultyResponse], summary="Danh sách khoa")
def list_faculties(
    skip:  int = Query(0,   ge=0,   description="Bỏ qua bao nhiêu bản ghi"),
    limit: int = Query(100, ge=1,   description="Số bản ghi tối đa trả về"),
    db:    Session = Depends(get_db),
    _:     User    = Depends(require_admin),
):
    return faculty_service.get_all_faculties(db, skip, limit)


@router.get("/{faculty_id}", response_model=FacultyResponse, summary="Chi tiết khoa")
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    return faculty_service.get_faculty_by_id(db, faculty_id)


@router.post("/", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED,
             summary="Tạo khoa mới")
def create_faculty(
    body: FacultyCreate,
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
):
    return faculty_service.create_faculty(db, body)


@router.put("/{faculty_id}", response_model=FacultyResponse, summary="Cập nhật khoa")
def update_faculty(
    faculty_id: int,
    body: FacultyUpdate,
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
):
    return faculty_service.update_faculty(db, faculty_id, body)


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Xóa khoa")
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    faculty_service.delete_faculty(db, faculty_id)