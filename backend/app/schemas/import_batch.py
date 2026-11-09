"""Pydantic schemas cho API Import dữ liệu đăng ký học phần."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ImportErrorDetail(BaseModel):
    """Mô tả chi tiết 1 dòng bị lỗi trong file."""
    row: int
    student_code: str
    detail: str


class ImportResultResponse(BaseModel):
    """Kết quả trả về ngay sau khi upload file."""
    import_batch_id: int
    file_name: str
    total_rows: int
    valid_rows: int
    error_rows: int
    errors: list[ImportErrorDetail]


class ImportBatchResponse(BaseModel):
    """Dữ liệu lịch sử các đợt import."""
    import_batch_id: int
    term_id: int
    file_name: str
    file_type: str
    uploaded_by: int
    uploaded_import_batch: datetime
    total_rows: int
    valid_rows: int
    error_rows: int
    file_checksum: str | None = None

    model_config = ConfigDict(from_attributes=True)