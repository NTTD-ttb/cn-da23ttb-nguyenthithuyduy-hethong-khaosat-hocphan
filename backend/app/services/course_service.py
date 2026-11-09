"""Nghiệp vụ quản lý Học phần — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


def get_all_courses(db: Session, skip: int = 0, limit: int = 100) -> list[Course]:
    """Lấy danh sách tất cả học phần."""
    return db.query(Course).offset(skip).limit(limit).all()


def get_course_by_id(db: Session, course_id: int) -> Course:
    """Lấy 1 học phần theo ID."""
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy học phần ID={course_id}."
        )
    return course


def create_course(db: Session, data: CourseCreate) -> Course:
    """Tạo học phần mới. Raise 409 nếu trùng mã."""
    existing = db.query(Course).filter(Course.course_code == data.course_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mã học phần '{data.course_code}' đã tồn tại."
        )

    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course_id: int, data: CourseUpdate) -> Course:
    """Cập nhật học phần."""
    course = get_course_by_id(db, course_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course_id: int) -> None:
    """Xóa học phần. Không xóa nếu đã có lớp học phần mở cho môn này."""
    course = get_course_by_id(db, course_id)
    if course.sections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa học phần đã được mở lớp học phần."
        )
    db.delete(course)
    db.commit()