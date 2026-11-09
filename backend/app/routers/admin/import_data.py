"""Router Upload & Quản lý Import dữ liệu — Admin."""

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.import_batch import ImportBatchResponse, ImportResultResponse
from app.services import import_service

router = APIRouter(prefix="/admin/import", tags=["Admin - Import Dữ liệu"])


@router.post(
    "/enrollments",
    response_model=ImportResultResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tải lên file đăng ký học phần (CSV/Excel)",
)
def upload_enrollments(
    file: UploadFile = File(..., description="File danh sách sinh viên đăng ký (.csv, .xlsx)"),
    term_id: int = Form(..., description="ID học kỳ áp dụng"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return import_service.process_enrollment_import(
        db=db,
        file=file,
        term_id=term_id,
        current_admin_id=admin.user_id,
    )


@router.get(
    "/batches",
    response_model=list[ImportBatchResponse],
    summary="Xem lịch sử các đợt import",
)
def list_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return import_service.get_all_batches(db, skip, limit)