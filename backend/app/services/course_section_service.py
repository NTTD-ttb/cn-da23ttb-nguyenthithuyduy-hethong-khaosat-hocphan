"""Nghiệp vụ quản lý Lớp học phần."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import CourseSection
from app.schemas.course_section import CourseSectionCreate, CourseSectionUpdate


def _enrich(section: CourseSection) -> CourseSection:
    """Gắn thêm tên học phần/giảng viên/học kỳ vào object để Response schema đọc được."""
    section.course_name   = section.course.course_name   if section.course   else None
    section.lecturer_name = section.lecturer.full_name   if section.lecturer else None
    section.term_name     = section.term.term_name       if section.term     else None
    section.academic_year = section.term.academic_year   if section.term     else None
    return section


def get_all_sections(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    course_id: int | None = None,
    lecturer_id: int | None = None,
    term_id: int | None = None,
    section_code: str | None = None,
) -> list[CourseSection]:
    """Lấy danh sách lớp học phần, hỗ trợ lọc theo nhiều tiêu chí."""
    query = db.query(CourseSection)
    if course_id:
        query = query.filter(CourseSection.course_id == course_id)
    if lecturer_id:
        query = query.filter(CourseSection.lecturer_id == lecturer_id)
    if term_id:
        query = query.filter(CourseSection.term_id == term_id)
    if section_code:
        query = query.filter(CourseSection.section_code.ilike(f"%{section_code}%"))
    sections = query.offset(skip).limit(limit).all()
    return [_enrich(s) for s in sections]


def get_section_by_id(db: Session, section_id: int) -> CourseSection:
    section = db.get(CourseSection, section_id)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Không tìm thấy lớp học phần ID={section_id}.")
    return _enrich(section)


def create_section(db: Session, data: CourseSectionCreate) -> CourseSection:
    """Tạo lớp học phần. Raise 409 nếu trùng (section_code, term_id)."""
    existing = db.query(CourseSection).filter(
        CourseSection.section_code == data.section_code,
        CourseSection.term_id      == data.term_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Lớp học phần '{data.section_code}' đã tồn tại trong học kỳ này.")
    section = CourseSection(**data.model_dump())
    db.add(section)
    db.commit()
    db.refresh(section)
    return _enrich(section)


def update_section(db: Session, section_id: int, data: CourseSectionUpdate) -> CourseSection:
    section = get_section_by_id(db, section_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(section, field, value)
    db.commit()
    db.refresh(section)
    return _enrich(section)


def delete_section(db: Session, section_id: int) -> None:
    section = get_section_by_id(db, section_id)
    if section.enrollments:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Không thể xóa lớp học phần đang có sinh viên đăng ký.")
    db.delete(section)
    db.commit()