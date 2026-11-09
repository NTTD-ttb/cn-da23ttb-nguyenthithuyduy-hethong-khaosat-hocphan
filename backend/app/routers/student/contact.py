"""Router Yêu cầu hỗ trợ & Phản ánh — Dành cho Sinh viên."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_student
from app.models.user import User
from app.schemas.student_contact import StudentContactCreate, StudentContactResponse
from app.services import student_contact_service

router = APIRouter(prefix="/student/contact", tags=["Sinh viên - Hỗ trợ & Khiếu nại"])


@router.post(
    "/",
    response_model=StudentContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi yêu cầu hỗ trợ / báo lỗi / khiếu nại thông tin",
)
def send_contact_request(
    body: StudentContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_contact_service.create_contact_request(db, current_user.user_id, body)


@router.get(
    "/my-requests",
    response_model=list[StudentContactResponse],
    summary="Xem lại danh sách các phản ánh của mình và câu trả lời của Admin",
)
def get_my_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return student_contact_service.get_my_contact_requests(db, current_user.user_id, skip, limit)