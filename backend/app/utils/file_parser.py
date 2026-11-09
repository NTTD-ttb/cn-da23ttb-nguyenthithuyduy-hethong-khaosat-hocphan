"""Tiện ích đọc file CSV / Excel phục vụ tính năng Import."""

import hashlib
import io
import pandas as pd
from fastapi import HTTPException, UploadFile, status


def calculate_file_checksum(file_bytes: bytes) -> str:
    """Tạo mã băm SHA-256 từ nội dung byte của file để kiểm tra trùng lặp."""
    return hashlib.sha256(file_bytes).hexdigest()


def read_uploaded_file(file: UploadFile, file_bytes: bytes) -> list[dict]:
    """
    Đọc file CSV hoặc Excel tải lên và chuyển thành danh sách các dictionary.
    Tự động chuẩn hóa tên cột về chữ thường không dấu cách thừa.
    """
    filename = (file.filename or "").lower()

    try:
        buffer = io.BytesIO(file_bytes)
        if filename.endswith(".csv"):
            df = pd.read_csv(buffer, dtype=str)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(buffer, dtype=str)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Định dạng file không hỗ trợ! Vui lòng chỉ tải lên file .csv hoặc .xlsx."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể đọc nội dung file: {str(e)}"
        )

    # Chuẩn hóa tên cột: bỏ khoảng trắng và chuyển chữ thường (ví dụ: ' MSSV ' -> 'mssv')
    df.columns = [str(col).strip().lower() for col in df.columns]

    # Điền giá trị rỗng thay cho NaN và chuyển thành danh sách dict
    df = df.fillna("")
    return df.to_dict(orient="records")