"""Nghiệp vụ quản lý Khoa — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.faculty import Faculty
from app.schemas.faculty import FacultyCreate, FacultyUpdate


def get_all_faculties(db: Session, skip: int = 0, limit: int = 100) -> list[Faculty]:
    """Lấy danh sách tất cả khoa, hỗ trợ phân trang."""
    return db.query(Faculty).offset(skip).limit(limit).all()


def get_faculty_by_id(db: Session, faculty_id: int) -> Faculty:
    """Lấy 1 khoa theo ID, raise 404 nếu không tồn tại."""
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Không tìm thấy khoa ID={faculty_id}.")
    return faculty


def create_faculty(db: Session, data: FacultyCreate) -> Faculty:
    """Tạo khoa mới. Raise 409 nếu mã khoa đã tồn tại."""
    existing = db.query(Faculty).filter(Faculty.faculty_code == data.faculty_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"Mã khoa '{data.faculty_code}' đã tồn tại.")
    faculty = Faculty(**data.model_dump())
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


def update_faculty(db: Session, faculty_id: int, data: FacultyUpdate) -> Faculty:
    """Cập nhật thông tin khoa."""
    faculty = get_faculty_by_id(db, faculty_id)
    # Chỉ cập nhật các trường được gửi lên (không None)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(faculty, field, value)
    db.commit()
    db.refresh(faculty)
    return faculty


def delete_faculty(db: Session, faculty_id: int) -> None:
    """Xóa khoa. Raise 400 nếu khoa còn lớp sinh viên hoặc giảng viên."""
    faculty = get_faculty_by_id(db, faculty_id)
    # Kiểm tra ràng buộc trước khi xóa
    if faculty.student_classes or faculty.lecturers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Không thể xóa khoa đang có lớp sinh viên hoặc giảng viên.")
    db.delete(faculty)
    db.commit()