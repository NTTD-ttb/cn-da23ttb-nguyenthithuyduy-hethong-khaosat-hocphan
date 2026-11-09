"""Nghiệp vụ quản lý Lớp sinh viên — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import StudentClass
from app.models.faculty import Faculty
from app.schemas.student_class import StudentClassCreate, StudentClassUpdate


def get_all_classes(db: Session, skip: int = 0, limit: int = 100) -> list[StudentClass]:
    """Lấy danh sách tất cả lớp sinh viên, hỗ trợ phân trang."""
    return db.query(StudentClass).offset(skip).limit(limit).all()


def get_class_by_id(db: Session, class_id: int) -> StudentClass:
    """Lấy 1 lớp theo ID, raise 404 nếu không tồn tại."""
    student_class = db.get(StudentClass, class_id)
    if not student_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy lớp sinh viên ID={class_id}."
        )
    return student_class


def create_class(db: Session, data: StudentClassCreate) -> StudentClass:
    """Tạo lớp sinh viên mới. Kiểm tra mã lớp và tồn tại của khoa."""
    existing = db.query(StudentClass).filter(StudentClass.class_code == data.class_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mã lớp '{data.class_code}' đã tồn tại."
        )

    faculty = db.get(Faculty, data.faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Khoa với ID={data.faculty_id} không tồn tại."
        )

    student_class = StudentClass(**data.model_dump())
    db.add(student_class)
    db.commit()
    db.refresh(student_class)
    return student_class


def update_class(db: Session, class_id: int, data: StudentClassUpdate) -> StudentClass:
    """Cập nhật thông tin lớp sinh viên."""
    student_class = get_class_by_id(db, class_id)

    if data.faculty_id is not None:
        faculty = db.get(Faculty, data.faculty_id)
        if not faculty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Khoa với ID={data.faculty_id} không tồn tại."
            )

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(student_class, field, value)

    db.commit()
    db.refresh(student_class)
    return student_class


def delete_class(db: Session, class_id: int) -> None:
    """Xóa lớp. Raise 400 nếu lớp đang có hồ sơ sinh viên."""
    student_class = get_class_by_id(db, class_id)
    if student_class.students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa lớp đang có sinh viên trực thuộc."
        )
    db.delete(student_class)
    db.commit()