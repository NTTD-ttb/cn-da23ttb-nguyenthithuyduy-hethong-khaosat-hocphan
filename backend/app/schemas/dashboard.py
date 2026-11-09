"""Pydantic schemas cho Dashboard Admin."""

from pydantic import BaseModel


class DashboardOverviewResponse(BaseModel):
    total_assignments: int
    completed_assignments: int
    in_progress_assignments: int
    not_started_assignments: int
    completion_rate: float
    total_text_feedback: int


class ProgressByFaculty(BaseModel):
    faculty_name: str
    total: int
    completed: int
    rate: float


class DashboardProgressChartResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    by_faculties: list[ProgressByFaculty]


class FeedbackSummaryItem(BaseModel):
    course_code: str
    course_name: str
    total_feedback: int


class DashboardFeedbackSummaryResponse(BaseModel):
    items: list[FeedbackSummaryItem]