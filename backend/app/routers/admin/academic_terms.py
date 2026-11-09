"""Router CRUD cho Học kỳ — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.academic_term import AcademicTermCreate, AcademicTermResponse, AcademicTermUpdate
from app.services import academic_term_service

router = APIRouter(prefix="/admin/academic-terms", tags=["Admin - Học kỳ"])


@router.get("/", response_model=list[AcademicTermResponse], summary="Danh sách học kỳ")
def list_terms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return academic_term_service.get_all_terms(db, skip, limit)


@router.get("/{term_id}", response_model=AcademicTermResponse, summary="Chi tiết học kỳ")
def get_term(
    term_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return academic_term_service.get_term_by_id(db, term_id)


@router.post("/", response_model=AcademicTermResponse, status_code=status.HTTP_201_CREATED, summary="Tạo học kỳ mới")
def create_term(
    body: AcademicTermCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return academic_term_service.create_term(db, body)


@router.put("/{term_id}", response_model=AcademicTermResponse, summary="Cập nhật học kỳ")
def update_term(
    term_id: int,
    body: AcademicTermUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return academic_term_service.update_term(db, term_id, body)


@router.delete("/{term_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa học kỳ")
def delete_term(
    term_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    academic_term_service.delete_term(db, term_id)