"""Router CRUD cho Lớp học phần — hỗ trợ lọc theo nhiều tiêu chí."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.course_section import CourseSectionCreate, CourseSectionResponse, CourseSectionUpdate
from app.services import course_section_service

router = APIRouter(prefix="/admin/course-sections", tags=["Admin - Lớp học phần"])


@router.get("/", response_model=list[CourseSectionResponse], summary="Danh sách lớp học phần")
def list_sections(
    skip:         int      = Query(0,    ge=0),
    limit:        int      = Query(100,  ge=1),
    course_id:    int | None = Query(None, description="Lọc theo học phần"),
    lecturer_id:  int | None = Query(None, description="Lọc theo giảng viên"),
    term_id:      int | None = Query(None, description="Lọc theo học kỳ"),
    section_code: str | None = Query(None, description="Tìm theo mã lớp học phần"),
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    return course_section_service.get_all_sections(
        db, skip, limit, course_id, lecturer_id, term_id, section_code
    )


@router.get("/{section_id}", response_model=CourseSectionResponse, summary="Chi tiết lớp học phần")
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    return course_section_service.get_section_by_id(db, section_id)


@router.post("/", response_model=CourseSectionResponse,
             status_code=status.HTTP_201_CREATED, summary="Tạo lớp học phần")
def create_section(
    body: CourseSectionCreate,
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
):
    return course_section_service.create_section(db, body)


@router.put("/{section_id}", response_model=CourseSectionResponse, summary="Cập nhật lớp học phần")
def update_section(
    section_id: int,
    body: CourseSectionUpdate,
    db:   Session = Depends(get_db),
    _:    User    = Depends(require_admin),
):
    return course_section_service.update_section(db, section_id, body)


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa lớp học phần")
def delete_section(
    section_id: int,
    db:  Session = Depends(get_db),
    _:   User    = Depends(require_admin),
):
    course_section_service.delete_section(db, section_id)