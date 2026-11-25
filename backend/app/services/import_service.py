"""Nghiệp vụ Import dữ liệu đăng ký học phần — tầng Service."""

import unicodedata

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.course import CourseSection
from app.models.import_batch import CourseEnrollment, ImportBatch
from app.models.student import StudentProfile
from app.schemas.import_batch import ImportErrorDetail, ImportResultResponse
from app.utils.file_parser import calculate_file_checksum, read_uploaded_file


def _normalize_column_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    without_accents = "".join(char for char in normalized if not unicodedata.combining(char))
    return "_".join(without_accents.split())


def get_all_batches(db: Session, skip: int = 0, limit: int = 100) -> list[ImportBatch]:
    """Xem danh sách các đợt import đã diễn ra."""
    return db.query(ImportBatch).order_by(ImportBatch.uploaded_import_batch.desc()).offset(skip).limit(limit).all()


def process_enrollment_import(
    db: Session,
    file: UploadFile,
    current_admin_id: int,
) -> ImportResultResponse:
    """Xử lý nhập file đăng ký học phần."""
    # 1. Đọc file dạng bytes & tính checksum
    file_bytes = file.file.read()
    checksum = calculate_file_checksum(file_bytes)

    # Kiểm tra xem file này đã từng được nạp chưa
    existing_checksum = db.query(ImportBatch).filter(ImportBatch.file_checksum == checksum).first()
    if existing_checksum:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tệp này đã từng được nhập vào hệ thống trước đó!"
        )

    # 2. Đọc dữ liệu ra danh sách dòng qua pandas
    records = read_uploaded_file(file, file_bytes)
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp không chứa dòng dữ liệu nào."
        )

    errors: list[ImportErrorDetail] = []
    prepared_rows: list[tuple[int, str, CourseSection | None]] = []
    term_ids: set[int] = set()

    # Tìm lớp theo mã lớp học phần để suy ra học kỳ từ dữ liệu đã có.
    for idx, row in enumerate(records, start=2):
        normalized_row = {_normalize_column_name(str(key)): value for key, value in row.items()}
        student_code = str(normalized_row.get("student_id", "") or "").strip()
        section_code = str(normalized_row.get("section_id", "") or "").strip()

        if not student_code or not section_code:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=student_code or "N/A",
                detail="Thiếu mã sinh viên (student_id) hoặc mã lớp học phần (section_id)."
            ))
            if not section_code:
                prepared_rows.append((idx, student_code, None))
                continue

        sections = db.query(CourseSection).filter(
            CourseSection.section_code == section_code
        ).all()
        if not sections:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=student_code,
                detail=f"Mã lớp học phần '{section_code}' không tồn tại trong hệ thống."
            ))
            prepared_rows.append((idx, student_code, None))
            continue
        if len(sections) > 1:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=student_code,
                detail=(
                    f"Mã lớp học phần '{section_code}' xuất hiện ở nhiều học kỳ; "
                    "không thể tự xác định học kỳ."
                )
            ))
            prepared_rows.append((idx, student_code, None))
            continue

        section = sections[0]
        term_ids.add(section.term_id)
        prepared_rows.append((idx, student_code, section))

    if not term_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xác định học kỳ từ mã lớp học phần hợp lệ trong tệp."
        )
    if len(term_ids) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp chứa lớp học phần thuộc nhiều học kỳ. Vui lòng nhập từng học kỳ bằng một tệp riêng."
        )

    term_id = next(iter(term_ids))
    existing_term_batch = db.query(ImportBatch).filter(ImportBatch.term_id == term_id).first()
    if existing_term_batch:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Học kỳ này đã có đợt nhập dữ liệu; hệ thống chỉ cho phép một đợt import mỗi học kỳ."
        )

    # 3. Khởi tạo bản ghi đợt nhập (ImportBatch)
    file_ext = "csv" if (file.filename or "").lower().endswith(".csv") else "xlsx"
    batch = ImportBatch(
        term_id=term_id,
        file_name=file.filename or "unknown",
        file_type=file_ext,
        uploaded_by=current_admin_id,
        total_rows=len(records),
        valid_rows=0,
        error_rows=0,
        file_checksum=checksum,
    )
    db.add(batch)
    db.flush()  # Để lấy ra batch.import_batch_id

    valid_count = 0

    # 4. Liên kết sinh viên và lớp học phần đã tồn tại
    for idx, student_code, section in prepared_rows:
        if section is None or not student_code:
            continue

        profile = db.query(StudentProfile).filter(StudentProfile.student_code == student_code).first()
        if not profile:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=student_code,
                detail=f"Mã sinh viên '{student_code}' không tồn tại trong hệ thống."
            ))
            continue

        # Kiểm tra sinh viên đã được gắn vào lớp học phần này chưa
        existing_enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == profile.student_id,
            CourseEnrollment.section_id == section.section_id
        ).first()

        if existing_enrollment:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=student_code,
                detail=f"Sinh viên đã được đăng ký vào lớp {section.section_code} trước đó."
            ))
            continue

        # Tạo bản ghi đăng ký hợp lệ
        enrollment = CourseEnrollment(
            student_id=profile.student_id,
            section_id=section.section_id,
            import_batch_id=batch.import_batch_id,
        )
        db.add(enrollment)
        valid_count += 1

    # 6. Cập nhật lại số lượng và commit
    batch.valid_rows = valid_count
    batch.error_rows = len(errors)
    db.commit()

    return ImportResultResponse(
        import_batch_id=batch.import_batch_id,
        file_name=batch.file_name,
        total_rows=batch.total_rows,
        valid_rows=batch.valid_rows,
        error_rows=batch.error_rows,
        errors=errors,
    )