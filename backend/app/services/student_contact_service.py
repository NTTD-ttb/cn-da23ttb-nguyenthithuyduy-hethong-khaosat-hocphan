"""Nghiệp vụ Yêu cầu hỗ trợ của Sinh viên — Tầng Service."""

from sqlalchemy.orm import Session

from app.models.contact import ContactRequest
from app.schemas.student_contact import StudentContactCreate, StudentContactResponse


def create_contact_request(
    db: Session,
    user_id: int,
    data: StudentContactCreate
) -> StudentContactResponse:
    """Lưu yêu cầu hỗ trợ hoặc phản ánh từ sinh viên vào CSDL."""
    contact = ContactRequest(
        user_id=user_id,
        request_type=data.request_type,
        subject=data.subject,
        content_contact_request=data.content_contact_request,
        status_contact_request="pending",
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return StudentContactResponse.model_validate(contact)


def get_my_contact_requests(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[StudentContactResponse]:
    """Xem lại danh sách các yêu cầu hỗ trợ của chính sinh viên và xem phản hồi của Admin."""
    requests = (
        db.query(ContactRequest)
        .filter(ContactRequest.user_id == user_id)
        .order_by(ContactRequest.created_contact_request.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [StudentContactResponse.model_validate(r) for r in requests]