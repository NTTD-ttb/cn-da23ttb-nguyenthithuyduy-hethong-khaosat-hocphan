"""Admin endpoints for importing training reference data."""

from io import BytesIO
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Font
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.training_data_import import TrainingDataImportResponse
from app.services import training_data_import_service

router = APIRouter(prefix="/admin/training-data/import", tags=["Admin - Import dữ liệu đào tạo"])

TEMPLATE_HEADERS = {
    "lecturers": ["Mã giảng viên", "Họ và tên giảng viên", "Email", "Số điện thoại", "Mã khoa"],
    "courses": ["Mã học phần", "Tên học phần", "Mô tả"],
    "course_sections": ["Mã lớp học phần", "Mã học phần", "Mã giảng viên", "Mã học kỳ"],
}
TEMPLATE_FILENAMES = {
    "lecturers": "Mẫu_dữ_liệu_giảng_viên.xlsx",
    "courses": "Mẫu_dữ_liệu_học_phần.xlsx",
    "course_sections": "Mẫu_dữ_liệu_lớp_học_phần.xlsx",
}


@router.get(
    "/templates/{category}",
    summary="Tải file Excel mẫu dữ liệu đào tạo",
)
def download_training_data_template(
    category: Literal["lecturers", "courses", "course_sections"],
    _: User = Depends(require_admin),
):
    headers = TEMPLATE_HEADERS.get(category)
    if not headers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy mẫu import cho loại dữ liệu này.",
        )

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Import"
    worksheet.append(headers)
    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = f"A1:{worksheet.cell(row=1, column=len(headers)).column_letter}1"

    for cell in worksheet[1]:
        cell.font = Font(bold=True)
        worksheet.column_dimensions[cell.column_letter].width = max(len(cell.value) + 4, 18)
    if category == "lecturers":
        for row_number in range(2, 1002):
            worksheet.cell(row=row_number, column=4).number_format = "@"

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{quote(TEMPLATE_FILENAMES[category])}"
            )
        },
    )


@router.post(
    "/{category}",
    response_model=TrainingDataImportResponse,
    summary="Import giảng viên, học phần hoặc lớp học phần từ Excel",
)
def import_training_data(
    category: Literal["lecturers", "courses", "course_sections"],
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return training_data_import_service.import_training_data(db, file, category)
