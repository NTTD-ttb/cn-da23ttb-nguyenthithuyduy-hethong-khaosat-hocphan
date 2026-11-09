"""Router CRUD Bộ câu hỏi & Câu hỏi khảo sát — Admin."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.survey import (
    SurveyTemplateCreate,
    SurveyTemplateResponse,
    SurveyTemplateUpdate,
    SurveyQuestionCreate,
    SurveyQuestionResponse,
    SurveyQuestionUpdate,
)
from app.services import survey_template_service

router = APIRouter(prefix="/admin/survey-templates", tags=["Admin - Bộ câu hỏi khảo sát"])


@router.get("/", response_model=list[SurveyTemplateResponse], summary="Danh sách bộ câu hỏi")
def list_templates(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_template_service.get_all_templates(db, skip, limit)


@router.get("/{template_id}", response_model=SurveyTemplateResponse, summary="Chi tiết bộ câu hỏi kèm các câu hỏi")
def get_template(template_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_template_service.get_template_by_id(db, template_id)


@router.post("/", response_model=SurveyTemplateResponse, status_code=status.HTTP_201_CREATED, summary="Tạo bộ câu hỏi")
def create_template(body: SurveyTemplateCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return survey_template_service.create_template(db, body, admin.user_id)


@router.put("/{template_id}", response_model=SurveyTemplateResponse, summary="Cập nhật bộ câu hỏi")
def update_template(template_id: int, body: SurveyTemplateUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_template_service.update_template(db, template_id, body)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa bộ câu hỏi")
def delete_template(template_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    survey_template_service.delete_template(db, template_id)


# --- Thao tác với câu hỏi ---
@router.post("/{template_id}/questions", response_model=SurveyQuestionResponse, status_code=status.HTTP_201_CREATED, summary="Thêm câu hỏi vào bộ")
def add_question(template_id: int, body: SurveyQuestionCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_template_service.add_question_to_template(db, template_id, body)


@router.put("/questions/{question_id}", response_model=SurveyQuestionResponse, summary="Cập nhật câu hỏi")
def update_question(question_id: int, body: SurveyQuestionUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return survey_template_service.update_question(db, question_id, body)


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa câu hỏi")
def delete_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    survey_template_service.delete_question(db, question_id)