"""Nghiệp vụ quản lý Giảng viên — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lecturer import Lecturer
from app.models.faculty import Faculty
from app.schemas.lecturer import LecturerCreate, LecturerUpdate


def get_all_lecturers(db: Session, skip: int = 0, limit: int = 100) -> list[Lecturer]:
    """Lấy danh sách giảng viên, hỗ trợ phân trang."""
    return db.query(Lecturer).offset(skip).limit(limit).all()


def get_lecturer_by_id(db: Session, lecturer_id: int) -> Lecturer:
    """Lấy 1 giảng viên theo ID."""
    lecturer = db.get(Lecturer, lecturer_id)
    if not lecturer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy giảng viên ID={lecturer_id}."
        )
    return lecturer


def create_lecturer(db: Session, data: LecturerCreate) -> Lecturer:
    """Tạo giảng viên mới. Kiểm tra mã giảng viên và khoa."""
    existing = db.query(Lecturer).filter(Lecturer.lecturer_code == data.lecturer_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mã giảng viên '{data.lecturer_code}' đã tồn tại."
        )

    if data.faculty_id:
        faculty = db.get(Faculty, data.faculty_id)
        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Khoa với ID={data.faculty_id} không tồn tại."
            )

    lecturer = Lecturer(**data.model_dump())
    db.add(lecturer)
    db.commit()
    db.refresh(lecturer)
    return lecturer


def update_lecturer(db: Session, lecturer_id: int, data: LecturerUpdate) -> Lecturer:
    """Cập nhật thông tin giảng viên."""
    lecturer = get_lecturer_by_id(db, lecturer_id)

    if data.faculty_id is not None:
        faculty = db.get(Faculty, data.faculty_id)
        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Khoa với ID={data.faculty_id} không tồn tại."
            )

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lecturer, field, value)

    db.commit()
    db.refresh(lecturer)
    return lecturer


def delete_lecturer(db: Session, lecturer_id: int) -> None:
    """Xóa giảng viên. Raise 400 nếu đang phụ trách lớp học phần."""
    lecturer = get_lecturer_by_id(db, lecturer_id)
    if lecturer.course_sections:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa giảng viên đang phụ trách lớp học phần."
        )
    db.delete(lecturer)
    db.commit()