"""Nghiệp vụ quản lý Học kỳ — tầng Service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.academic_term import AcademicTerm
from app.schemas.academic_term import AcademicTermCreate, AcademicTermUpdate


def get_all_terms(db: Session, skip: int = 0, limit: int = 100) -> list[AcademicTerm]:
    """Lấy danh sách tất cả học kỳ."""
    return db.query(AcademicTerm).offset(skip).limit(limit).all()


def get_term_by_id(db: Session, term_id: int) -> AcademicTerm:
    """Lấy 1 học kỳ theo ID."""
    term = db.get(AcademicTerm, term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy học kỳ ID={term_id}."
        )
    return term


def create_term(db: Session, data: AcademicTermCreate) -> AcademicTerm:
    """Tạo học kỳ mới."""
    existing = db.query(AcademicTerm).filter(AcademicTerm.term_code == data.term_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Mã học kỳ '{data.term_code}' đã tồn tại."
        )

    term = AcademicTerm(**data.model_dump())
    db.add(term)
    db.commit()
    db.refresh(term)
    return term


def update_term(db: Session, term_id: int, data: AcademicTermUpdate) -> AcademicTerm:
    """Cập nhật học kỳ."""
    term = get_term_by_id(db, term_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(term, field, value)
    db.commit()
    db.refresh(term)
    return term


def delete_term(db: Session, term_id: int) -> None:
    """Xóa học kỳ. Raise 400 nếu đã gắn với lớp HP hoặc đợt khảo sát/import."""
    term = get_term_by_id(db, term_id)
    if term.course_sections or term.import_batch or term.survey_campaign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa học kỳ đã phát sinh dữ liệu (lớp HP, import hoặc khảo sát)."
        )
    db.delete(term)
    db.commit()