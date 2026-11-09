"""Pydantic schemas cho Phân hệ Làm khảo sát của Sinh viên."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


# --- 1. MỤC DANH SÁCH KHẢO SÁT CẦN LÀM ---
class StudentSurveyListItem(BaseModel):
    assignment_id: int
    campaign_id: int
    campaign_name: str
    course_code: str
    course_name: str
    section_code: str
    lecturer_name: str
    term_name: str
    academic_year: str
    status: str = Field(..., description="'not_started', 'in_progress', 'completed'")
    end_date: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


# --- 2. CÂU TRẢ LỜI CỦA SINH VIÊN (DÙNG CHO LƯU NHÁP / NỘP BÀI) ---
class StudentAnswerItem(BaseModel):
    question_id: int
    answer_text: str | None = Field(None, description="Nội dung nhận xét văn bản nếu là câu hỏi text")
    answer_number: float | None = Field(None, description="Điểm đánh giá sao nếu là câu hỏi rating (ví dụ: 1 đến 5)")
    answer_json: Any | None = Field(None, description="Lựa chọn trắc nghiệm đơn/nhiều nếu là choice")


class StudentSurveySubmitRequest(BaseModel):
    """Payload gửi lên khi sinh viên bấm 'Lưu nháp' hoặc 'Nộp bài'."""
    answers: list[StudentAnswerItem] = Field(..., description="Danh sách các câu trả lời")


# --- 3. CHI TIẾT BỘ CÂU HỎI & BÀI LÀM HIỆN TẠI (ĐỂ VẼ GIAO DIỆN) ---
class QuestionForStudent(BaseModel):
    question_id: int
    question_code: str
    question_text: str
    question_type: str = Field(..., description="'rating', 'text', 'single_choice', 'multiple_choice'")
    is_required: bool
    display_order: int
    options_json: Any | None = None
    min_value: float | None = None
    max_value: float | None = None

    model_config = ConfigDict(from_attributes=True)


class CurrentAnswer(BaseModel):
    """Câu trả lời cũ đã từng lưu nháp (nếu có)."""
    question_id: int
    answer_text: str | None = None
    answer_number: float | None = None
    answer_json: Any | None = None

    model_config = ConfigDict(from_attributes=True)


class StudentSurveyDetailResponse(BaseModel):
    assignment_id: int
    status: str
    course_name: str
    course_code: str
    section_code: str
    lecturer_name: str
    term_name: str
    academic_year: str
    questions: list[QuestionForStudent]
    saved_answers: list[CurrentAnswer] = []

    model_config = ConfigDict(from_attributes=True)


# --- 4. KẾT QUẢ TRẢ VỀ SAU KHI NỘP BÀI ---
class SurveySubmitSuccessResponse(BaseModel):
    assignment_id: int
    message: str
    completed_at: datetime