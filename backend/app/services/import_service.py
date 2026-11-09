"""Nghiệp vụ Import dữ liệu đăng ký học phần — tầng Service."""

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.academic_term import AcademicTerm
from app.models.course import CourseSection
from app.models.import_batch import ImportBatch, CourseEnrollment
from app.models.student import StudentProfile
from app.models.user import User
from app.schemas.import_batch import ImportErrorDetail, ImportResultResponse
from app.utils.file_parser import calculate_file_checksum, read_uploaded_file
from app.utils.security import hash_password


def get_all_batches(db: Session, skip: int = 0, limit: int = 100) -> list[ImportBatch]:
    """Xem danh sách các đợt import đã diễn ra."""
    return db.query(ImportBatch).order_by(ImportBatch.uploaded_import_batch.desc()).offset(skip).limit(limit).all()


def process_enrollment_import(
    db: Session,
    file: UploadFile,
    term_id: int,
    current_admin_id: int,
) -> ImportResultResponse:
    """Xử lý nhập file đăng ký học phần."""
    # 1. Kiểm tra học kỳ tồn tại
    term = db.get(AcademicTerm, term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Học kỳ ID={term_id} không tồn tại trên hệ thống."
        )

    # 2. Đọc file dạng bytes & tính checksum
    file_bytes = file.file.read()
    checksum = calculate_file_checksum(file_bytes)

    # Kiểm tra xem file này đã từng được nạp chưa
    existing_checksum = db.query(ImportBatch).filter(ImportBatch.file_checksum == checksum).first()
    if existing_checksum:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tệp này đã từng được nhập vào hệ thống trước đó!"
        )

    # 3. Đọc dữ liệu ra danh sách dòng qua pandas
    records = read_uploaded_file(file, file_bytes)
    if not records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp không chứa dòng dữ liệu nào."
        )

    # 4. Khởi tạo bản ghi đợt nhập (ImportBatch)
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

    errors: list[ImportErrorDetail] = []
    valid_count = 0

    # 5. Duyệt từng dòng trong file
    for idx, row in enumerate(records, start=2):  # start=2 vì dòng 1 là tiêu đề
        # Lấy thông tin từ các cột chuẩn hóa
        mssv = str(row.get("mssv", "")).strip()
        ho_ten = str(row.get("ho_ten", "") or row.get("ten_sinh_vien", "")).strip()
        section_code = str(row.get("ma_lop_hoc_phan", "") or row.get("ma_hoc_phan", "")).strip()

        if not mssv or not section_code:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=mssv or "N/A",
                detail="Thiếu MSSV hoặc Mã lớp học phần."
            ))
            continue

        # Tìm lớp học phần trong kỳ này
        section = db.query(CourseSection).filter(
            CourseSection.section_code == section_code,
            CourseSection.term_id == term_id
        ).first()

        if not section:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=mssv,
                detail=f"Lớp học phần '{section_code}' không tồn tại trong học kỳ này."
            ))
            continue

        # Tìm sinh viên xem đã có hồ sơ chưa
        profile = db.query(StudentProfile).filter(StudentProfile.student_code == mssv).first()
        if not profile:
            # Tự động tạo User mới cho sinh viên này (mật khẩu mặc định: Student@123)
            default_email = f"{mssv.lower()}@st.tvu.edu.vn"
            new_user = User(
                email=default_email,
                password_hash=hash_password("Student@123"),
                role="student",
                must_change_password=True,
            )
            db.add(new_user)
            db.flush()

            profile = StudentProfile(
                student_id=new_user.user_id,
                student_code=mssv,
                full_name=ho_ten or f"Sinh viên {mssv}",
            )
            db.add(profile)
            db.flush()

        # Kiểm tra sinh viên đã được gắn vào lớp học phần này chưa
        existing_enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == profile.student_id,
            CourseEnrollment.section_id == section.section_id
        ).first()

        if existing_enrollment:
            errors.append(ImportErrorDetail(
                row=idx,
                student_code=mssv,
                detail=f"Sinh viên đã được đăng ký vào lớp {section_code} trước đó."
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