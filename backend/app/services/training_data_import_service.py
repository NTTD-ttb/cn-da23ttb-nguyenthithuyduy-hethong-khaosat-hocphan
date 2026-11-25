"""Import lecturers, courses, and course sections from Excel files."""

import unicodedata

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.academic_term import AcademicTerm
from app.models.course import Course, CourseSection
from app.models.faculty import Faculty
from app.models.lecturer import Lecturer
from app.schemas.training_data_import import (
    TrainingDataImportError,
    TrainingDataImportResponse,
)
from app.utils.file_parser import read_uploaded_file

IMPORT_HEADERS = {
    "lecturers": {
        "lecturer_code": {"lecturer_code", "ma_giang_vien"},
        "full_name": {
            "full_name",
            "lecturer_name",
            "ten_giang_vien",
            "ho_va_ten",
            "ho_va_ten_giang_vien",
        },
        "email": {"email"},
        "phone": {"phone", "so_dien_thoai"},
        "faculty_code": {"faculty_code", "ma_khoa", "khoa_phu_thuoc"},
    },
    "courses": {
        "course_code": {"course_code", "ma_hoc_phan"},
        "course_name": {"course_name", "ten_hoc_phan"},
        "description": {"description", "mo_ta"},
    },
    "course_sections": {
        "section_code": {"section_code", "ma_lop_hoc_phan"},
        "course_code": {"course_code", "ma_hoc_phan"},
        "lecturer_code": {"lecturer_code", "ma_giang_vien"},
        "term_code": {"term_code", "ma_hoc_ky", "hoc_ky"},
    },
}

REQUIRED_HEADERS = {
    "lecturers": {"lecturer_code", "full_name"},
    "courses": {"course_code", "course_name"},
    "course_sections": {"section_code", "course_code", "lecturer_code", "term_code"},
}


def _normalize_header(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    without_accents = "".join(
        char for char in normalized if not unicodedata.combining(char)
    )
    without_accents = without_accents.replace("đ", "d")
    return "_".join(without_accents.split())


def _normalize_code(value: str) -> str:
    return value.strip().upper()


def _get_values(
    raw_row: dict[str, str],
    category: str,
) -> dict[str, str]:
    aliases = IMPORT_HEADERS[category]
    alias_to_field = {
        alias: field
        for field, field_aliases in aliases.items()
        for alias in field_aliases
    }
    values: dict[str, str] = {}
    for header, value in raw_row.items():
        field = alias_to_field.get(_normalize_header(str(header)))
        if field:
            values[field] = "" if value is None else str(value).strip()
    return values


def _validate_headers(records: list[dict[str, str]], category: str) -> None:
    aliases = IMPORT_HEADERS[category]
    found = {
        field
        for header in records[0]
        for field, field_aliases in aliases.items()
        if _normalize_header(str(header)) in field_aliases
    }
    missing = REQUIRED_HEADERS[category] - found
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Thiếu cột bắt buộc trong file: {', '.join(sorted(missing))}.",
        )


def _raw_values(raw_row: dict[str, str]) -> dict[str, str]:
    return {
        str(key): "" if value is None else str(value).strip()
        for key, value in raw_row.items()
    }


def _validate_and_create(
    db: Session,
    category: str,
    values: dict[str, str],
) -> str | None:
    """Return a row error, or create one record and return None."""
    if category == "lecturers":
        lecturer_code = _normalize_code(values.get("lecturer_code", ""))
        full_name = values.get("full_name", "")
        email = values.get("email", "") or None
        phone = values.get("phone", "") or None
        faculty_code = _normalize_code(values.get("faculty_code", ""))

        if not lecturer_code or not full_name:
            return "Thiếu mã giảng viên hoặc tên giảng viên."
        if len(lecturer_code) > 20 or len(full_name) > 150:
            return "Mã giảng viên tối đa 20 ký tự, tên tối đa 150 ký tự."
        if email and len(email) > 255:
            return "Email vượt quá 255 ký tự."
        if phone and len(phone) > 20:
            return "Số điện thoại vượt quá 20 ký tự."
        if db.query(Lecturer).filter(
            func.upper(Lecturer.lecturer_code) == lecturer_code
        ).first():
            return f"Mã giảng viên '{lecturer_code}' đã tồn tại."
        if email and db.query(Lecturer).filter(
            func.lower(Lecturer.email) == email.lower()
        ).first():
            return f"Email '{email}' đã được sử dụng."

        faculty_id = None
        if faculty_code:
            faculty = db.query(Faculty).filter(
                func.upper(Faculty.faculty_code) == faculty_code
            ).first()
            if not faculty:
                return f"Mã khoa '{faculty_code}' không tồn tại."
            faculty_id = faculty.faculty_id

        record = Lecturer(
            lecturer_code=lecturer_code,
            full_name=full_name,
            email=email,
            phone=phone,
            faculty_id=faculty_id,
        )
    elif category == "courses":
        course_code = _normalize_code(values.get("course_code", ""))
        course_name = values.get("course_name", "")
        description = values.get("description", "") or None

        if not course_code or not course_name:
            return "Thiếu mã học phần hoặc tên học phần."
        if len(course_code) > 30 or len(course_name) > 200:
            return "Mã học phần tối đa 30 ký tự, tên tối đa 200 ký tự."
        if db.query(Course).filter(
            func.upper(Course.course_code) == course_code
        ).first():
            return f"Mã học phần '{course_code}' đã tồn tại."

        record = Course(
            course_code=course_code,
            course_name=course_name,
            description=description,
        )
    else:
        section_code = _normalize_code(values.get("section_code", ""))
        course_code = _normalize_code(values.get("course_code", ""))
        lecturer_code = _normalize_code(values.get("lecturer_code", ""))
        term_code = _normalize_code(values.get("term_code", ""))

        if not section_code or not course_code or not lecturer_code or not term_code:
            return "Thiếu mã lớp học phần, mã học phần, mã giảng viên hoặc mã học kỳ."
        if len(section_code) > 30:
            return "Mã lớp học phần tối đa 30 ký tự."

        course = db.query(Course).filter(
            func.upper(Course.course_code) == course_code
        ).first()
        lecturer = db.query(Lecturer).filter(
            func.upper(Lecturer.lecturer_code) == lecturer_code
        ).first()
        term = db.query(AcademicTerm).filter(
            func.upper(AcademicTerm.term_code) == term_code
        ).first()
        if course is None or lecturer is None or term is None:
            missing = []
            if course is None:
                missing.append(f"mã học phần '{course_code}'")
            if lecturer is None:
                missing.append(f"mã giảng viên '{lecturer_code}'")
            if term is None:
                missing.append(f"mã học kỳ '{term_code}'")
            return f"Không tìm thấy trong hệ thống: {', '.join(missing)}."
        if db.query(CourseSection).filter(
            func.upper(CourseSection.section_code) == section_code,
            CourseSection.term_id == term.term_id,
        ).first():
            return (
                f"Mã lớp học phần '{section_code}' đã tồn tại "
                f"trong học kỳ '{term_code}'."
            )

        record = CourseSection(
            section_code=section_code,
            course_id=course.course_id,
            lecturer_id=lecturer.lecturer_id,
            term_id=term.term_id,
        )

    try:
        with db.begin_nested():
            db.add(record)
            db.flush()
    except IntegrityError:
        return "Bản ghi bị trùng hoặc vi phạm ràng buộc dữ liệu."
    return None


def import_training_data(
    db: Session,
    file: UploadFile,
    category: str,
) -> TrainingDataImportResponse:
    if category not in IMPORT_HEADERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loại dữ liệu import không được hỗ trợ.",
        )
    filename = (file.filename or "").lower()
    if not filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ hỗ trợ file .csv, .xlsx hoặc .xls.",
        )

    file_bytes = file.file.read()
    records = read_uploaded_file(file, file_bytes)
    records = [
        row
        for row in records
        if any(value is not None and str(value).strip() for value in row.values())
    ]
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File không chứa dòng dữ liệu nào.",
        )
    _validate_headers(records, category)

    imported_rows = 0
    errors: list[TrainingDataImportError] = []
    for row_number, raw_row in enumerate(records, start=2):
        error = _validate_and_create(db, category, _get_values(raw_row, category))
        if error:
            errors.append(
                TrainingDataImportError(
                    row=row_number,
                    values=_raw_values(raw_row),
                    error=error,
                )
            )
        else:
            imported_rows += 1

    db.commit()
    return TrainingDataImportResponse(
        total_rows=len(records),
        imported_rows=imported_rows,
        error_rows=len(errors),
        errors=errors,
    )
