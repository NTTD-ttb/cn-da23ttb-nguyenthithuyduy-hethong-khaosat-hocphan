"""Router Khảo sát học phần — Dành cho Sinh viên."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_student
from app.models.user import User
from app.schemas.student_survey import (
    StudentSurveyListItem,
    StudentSurveyDetailResponse,
    StudentSurveySubmitRequest,
    SurveySubmitSuccessResponse,
)
from app.services import student_survey_service

router = APIRouter(prefix="/student/surveys", tags=["Sinh viên - Làm khảo sát"])


@router.get(
    "/",
    response_model=list[StudentSurveyListItem],
    summary="Danh sách các môn học cần khảo sát",
)
def list_my_surveys(
    status_filter: str | None = Query(
        None, 
        alias="status", 
        description="Lọc theo trạng thái: 'not_started', 'in_progress', 'completed'"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_survey_service.get_student_surveys(db, current_user.user_id, status_filter)


@router.get(
    "/{assignment_id}",
    response_model=StudentSurveyDetailResponse,
    summary="Lấy chi tiết câu hỏi của một môn học (kèm câu trả lời đã lưu nháp nếu có)",
)
def get_survey_detail(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_survey_service.get_survey_detail(db, assignment_id, current_user.user_id)


@router.post(
    "/{assignment_id}/save-draft",
    response_model=SurveySubmitSuccessResponse,
    summary="Lưu nháp câu trả lời khảo sát",
)
def save_draft(
    assignment_id: int,
    body: StudentSurveySubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_survey_service.save_or_submit_survey(
        db, assignment_id, current_user.user_id, body, is_submit=False
    )


@router.post(
    "/{assignment_id}/submit",
    response_model=SurveySubmitSuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Nộp bài khảo sát chính thức (Khóa bài làm)",
)
def submit_survey(
    assignment_id: int,
    body: StudentSurveySubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_survey_service.save_or_submit_survey(
        db, assignment_id, current_user.user_id, body, is_submit=True
    )