"""Router CRUD cho Học phần — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services import course_service

router = APIRouter(prefix="/admin/courses", tags=["Admin - Học phần"])


@router.get("/", response_model=list[CourseResponse], summary="Danh sách học phần")
def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return course_service.get_all_courses(db, skip, limit)


@router.get("/{course_id}", response_model=CourseResponse, summary="Chi tiết học phần")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return course_service.get_course_by_id(db, course_id)


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, summary="Tạo học phần mới")
def create_course(
    body: CourseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return course_service.create_course(db, body)


@router.put("/{course_id}", response_model=CourseResponse, summary="Cập nhật học phần")
def update_course(
    course_id: int,
    body: CourseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return course_service.update_course(db, course_id, body)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa học phần")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    course_service.delete_course(db, course_id)