"""Pydantic schemas cho Khảo sát (Bộ câu hỏi, Đợt khảo sát, Tiến độ)."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


# --- CÂU HỎI KHẢO SÁT (SurveyQuestion) ---
class SurveyQuestionBase(BaseModel):
    question_code: str = Field(..., max_length=30, description="Mã câu hỏi duy nhất, ví dụ: Q1_GV")
    question_text: str = Field(..., description="Nội dung câu hỏi")
    question_type: str = Field(..., description="'rating', 'text', 'single_choice', 'multiple_choice'")
    topic_id: int | None = Field(None, description="ID chủ đề dự kiến")
    is_required: bool = Field(True, description="Bắt buộc trả lời hay không")
    display_order: int = Field(..., description="Thứ tự hiển thị (1, 2, 3...)")
    options_json: Any | None = Field(None, description="Danh sách lựa chọn dạng JSON (nếu là câu hỏi trắc nghiệm)")
    min_value: float | None = Field(None, description="Điểm đánh giá nhỏ nhất (ví dụ 1.0)")
    max_value: float | None = Field(None, description="Điểm đánh giá lớn nhất (ví dụ 5.0)")


class SurveyQuestionCreate(SurveyQuestionBase):
    pass


class SurveyQuestionUpdate(BaseModel):
    question_code: str | None = None
    question_text: str | None = None
    question_type: str | None = None
    topic_id: int | None = None
    is_required: bool | None = None
    display_order: int | None = None
    options_json: Any | None = None
    min_value: float | None = None
    max_value: float | None = None


class SurveyQuestionResponse(SurveyQuestionBase):
    question_id: int
    template_id: int
    created_question: datetime

    model_config = ConfigDict(from_attributes=True)


# --- BỘ CÂU HỎI KHẢO SÁT (SurveyTemplate) ---
class SurveyTemplateBase(BaseModel):
    template_name: str = Field(..., max_length=200, description="Tên bộ câu hỏi")
    term_id: int = Field(..., description="ID học kỳ áp dụng")
    version_number: int = Field(1, description="Phiên bản bộ câu hỏi")
    status_survey_template: str = Field("draft", description="'draft', 'active', 'archived'")


class SurveyTemplateCreate(SurveyTemplateBase):
    pass


class SurveyTemplateUpdate(BaseModel):
    template_name: str | None = None
    version_number: int | None = None
    status_survey_template: str | None = None


class SurveyTemplateResponse(SurveyTemplateBase):
    template_id: int
    created_by: int | None = None
    created_survey_templates: datetime
    questions: list[SurveyQuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- ĐỢT KHẢO SÁT (SurveyCampaign) ---
class SurveyCampaignBase(BaseModel):
    term_id: int = Field(..., description="ID học kỳ triển khai khảo sát")
    template_id: int = Field(..., description="ID bộ câu hỏi sử dụng")
    campaign_name: str = Field(..., max_length=200, description="Tên đợt khảo sát")
    start_survey_campaigns: datetime = Field(..., description="Thời gian bắt đầu mở")
    end_survey_campaigns: datetime = Field(..., description="Thời gian kết thúc")
    status: str = Field("draft", description="'draft', 'scheduled', 'open', 'closed'")


class SurveyCampaignCreate(SurveyCampaignBase):
    pass


class SurveyCampaignUpdateStatus(BaseModel):
    status: str = Field(..., description="Trạng thái mới: 'draft', 'scheduled', 'open', 'closed'")


class SurveyCampaignResponse(SurveyCampaignBase):
    campaign_id: int
    created_by: int | None = None
    created_survey_campaigns: datetime

    model_config = ConfigDict(from_attributes=True)


# --- TIẾN ĐỘ KHẢO SÁT (SurveyProgress) ---
class SurveyProgressItem(BaseModel):
    assignment_id: int
    student_code: str
    student_name: str
    section_code: str
    course_name: str
    lecturer_name: str
    status: str
    assigned_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)