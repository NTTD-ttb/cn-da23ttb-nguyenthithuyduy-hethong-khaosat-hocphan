"""Nghiệp vụ quản lý Bộ câu hỏi và Câu hỏi khảo sát."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.academic_term import AcademicTerm
from app.models.survey import SurveyTemplate, SurveyQuestion
from app.schemas.survey import (
    SurveyTemplateCreate,
    SurveyTemplateUpdate,
    SurveyQuestionCreate,
    SurveyQuestionUpdate,
)


def get_all_templates(db: Session, skip: int = 0, limit: int = 100) -> list[SurveyTemplate]:
    return db.query(SurveyTemplate).offset(skip).limit(limit).all()


def get_template_by_id(db: Session, template_id: int) -> SurveyTemplate:
    template = db.get(SurveyTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bộ câu hỏi ID={template_id}.")
    return template


def create_template(db: Session, data: SurveyTemplateCreate, admin_id: int) -> SurveyTemplate:
    if not db.get(AcademicTerm, data.term_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Học kỳ không tồn tại.")

    existing = db.query(SurveyTemplate).filter(SurveyTemplate.term_id == data.term_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Học kỳ này đã có bộ câu hỏi.")

    template = SurveyTemplate(**data.model_dump(), created_by=admin_id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_template(db: Session, template_id: int, data: SurveyTemplateUpdate) -> SurveyTemplate:
    template = get_template_by_id(db, template_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(template, field, value)
    db.commit()
    db.refresh(template)
    return template


def delete_template(db: Session, template_id: int) -> None:
    template = get_template_by_id(db, template_id)
    if template.campaigns:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bộ câu hỏi đã được dùng cho đợt khảo sát, không thể xóa.")
    db.delete(template)
    db.commit()


# --- Xử lý từng câu hỏi trong bộ câu hỏi ---
def add_question_to_template(db: Session, template_id: int, data: SurveyQuestionCreate) -> SurveyQuestion:
    get_template_by_id(db, template_id)
    existing_code = db.query(SurveyQuestion).filter(SurveyQuestion.question_code == data.question_code).first()
    if existing_code:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Mã câu hỏi '{data.question_code}' đã tồn tại.")

    question = SurveyQuestion(**data.model_dump(), template_id=template_id)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def update_question(db: Session, question_id: int, data: SurveyQuestionUpdate) -> SurveyQuestion:
    question = db.get(SurveyQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy câu hỏi ID={question_id}.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


def delete_question(db: Session, question_id: int) -> None:
    question = db.get(SurveyQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy câu hỏi ID={question_id}.")
    if question.answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Câu hỏi này đã có sinh viên trả lời, không thể xóa.")
    db.delete(question)
    db.commit()