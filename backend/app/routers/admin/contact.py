"""Router Quản lý Yêu cầu hỗ trợ & Phản hồi sinh viên — Admin."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.models.contact import ContactRequest
from app.models.student import StudentProfile

router = APIRouter(prefix="/admin/contact-requests", tags=["Admin - Yêu cầu hỗ trợ"])


class AdminContactUpdateRequest(BaseModel):
    status_contact_request: str | None = None
    admin_note: str | None = None


class AdminContactResponse(BaseModel):
    request_id: int
    user_id: int
    request_type: str
    subject: str | None = None
    content_contact_request: str
    status_contact_request: str
    admin_note: str | None = None
    created_contact_request: datetime
    resolved_contact_request: datetime | None = None

    # Extra student info
    student_code: str | None = None
    student_name: str | None = None
    student_email: str | None = None
    student_class: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ContactStatsResponse(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    closed: int


@router.get("/stats", response_model=ContactStatsResponse, summary="Thống kê yêu cầu hỗ trợ")
def get_contact_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total = db.query(ContactRequest).count()
    pending = db.query(ContactRequest).filter(ContactRequest.status_contact_request == "pending").count()
    in_progress = db.query(ContactRequest).filter(ContactRequest.status_contact_request == "in_progress").count()
    resolved = db.query(ContactRequest).filter(ContactRequest.status_contact_request == "resolved").count()
    closed = db.query(ContactRequest).filter(ContactRequest.status_contact_request == "closed").count()
    return ContactStatsResponse(
        total=total,
        pending=pending,
        in_progress=in_progress,
        resolved=resolved,
        closed=closed,
    )


@router.get("/", response_model=list[AdminContactResponse], summary="Danh sách yêu cầu hỗ trợ sinh viên")
def list_contact_requests(
    status_filter: str | None = Query(None, alias="status"),
    request_type: str | None = None,
    search: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = (
        db.query(ContactRequest)
        .outerjoin(User, ContactRequest.user_id == User.user_id)
        .outerjoin(StudentProfile, StudentProfile.student_id == User.user_id)
    )

    if status_filter and status_filter != "all":
        query = query.filter(ContactRequest.status_contact_request == status_filter)
    if request_type and request_type != "all":
        query = query.filter(ContactRequest.request_type == request_type)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ContactRequest.subject.ilike(search_pattern),
                ContactRequest.content_contact_request.ilike(search_pattern),
                StudentProfile.student_code.ilike(search_pattern),
                StudentProfile.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    requests = (
        query.order_by(desc(ContactRequest.created_contact_request))
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for req in requests:
        user = req.user
        sp = user.student_profile if user else None
        sc = sp.student_class if sp else None
        results.append(
            AdminContactResponse(
                request_id=req.request_id,
                user_id=req.user_id,
                request_type=req.request_type,
                subject=req.subject,
                content_contact_request=req.content_contact_request,
                status_contact_request=req.status_contact_request,
                admin_note=req.admin_note,
                created_contact_request=req.created_contact_request,
                resolved_contact_request=req.resolved_contact_request,
                student_code=sp.student_code if sp else None,
                student_name=sp.full_name if sp else (user.email if user else None),
                student_email=user.email if user else None,
                student_class=sc.class_name if sc else None,
            )
        )
    return results


@router.put("/{request_id}", response_model=AdminContactResponse, summary="Phản hồi & Cập nhật yêu cầu")
def update_contact_request(
    request_id: int,
    body: AdminContactUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    req = db.query(ContactRequest).filter(ContactRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu hỗ trợ")

    if body.status_contact_request is not None:
        req.status_contact_request = body.status_contact_request
        if body.status_contact_request in ["resolved", "closed"]:
            req.resolved_contact_request = datetime.now()
        elif body.status_contact_request == "pending":
            req.resolved_contact_request = None

    if body.admin_note is not None:
        req.admin_note = body.admin_note

    req.assigned_admin_id = current_admin.user_id
    db.commit()
    db.refresh(req)

    user = req.user
    sp = user.student_profile if user else None
    sc = sp.student_class if sp else None

    return AdminContactResponse(
        request_id=req.request_id,
        user_id=req.user_id,
        request_type=req.request_type,
        subject=req.subject,
        content_contact_request=req.content_contact_request,
        status_contact_request=req.status_contact_request,
        admin_note=req.admin_note,
        created_contact_request=req.created_contact_request,
        resolved_contact_request=req.resolved_contact_request,
        student_code=sp.student_code if sp else None,
        student_name=sp.full_name if sp else (user.email if user else None),
        student_email=user.email if user else None,
        student_class=sc.class_name if sc else None,
    )


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Xóa yêu cầu hỗ trợ")
def delete_contact_request(
    request_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    req = db.query(ContactRequest).filter(ContactRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu hỗ trợ")
    db.delete(req)
    db.commit()
