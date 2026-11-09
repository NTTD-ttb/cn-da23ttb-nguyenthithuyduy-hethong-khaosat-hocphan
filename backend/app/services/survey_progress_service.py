"""Nghiệp vụ Theo dõi tiến độ khảo sát."""

from sqlalchemy.orm import Session
from app.models.survey import SurveyAssignment, SurveyCampaign
from app.models.import_batch import CourseEnrollment
from app.models.student import StudentProfile
from app.models.course import CourseSection, Course
from app.models.lecturer import Lecturer
from app.schemas.survey import SurveyProgressItem


def get_survey_progress(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    campaign_id: int | None = None,
    section_id: int | None = None,
    status_filter: str | None = None,
    search_student: str | None = None,
) -> list[SurveyProgressItem]:
    """Truy vấn bảng survey_assignments kèm thông tin sinh viên, môn học, giảng viên."""
    query = (
        db.query(
            SurveyAssignment,
            StudentProfile.student_code,
            StudentProfile.full_name.label("student_name"),
            CourseSection.section_code,
            Course.course_name,
            Lecturer.full_name.label("lecturer_name"),
        )
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(StudentProfile, CourseEnrollment.student_id == StudentProfile.student_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
    )

    if campaign_id:
        query = query.filter(SurveyAssignment.campaign_id == campaign_id)
    if section_id:
        query = query.filter(CourseSection.section_id == section_id)
    if status_filter:
        query = query.filter(SurveyAssignment.status_survey_assignment == status_filter)
    if search_student:
        query = query.filter(
            (StudentProfile.student_code.ilike(f"%{search_student}%"))
            | (StudentProfile.full_name.ilike(f"%{search_student}%"))
        )

    results = query.offset(skip).limit(limit).all()

    items: list[SurveyProgressItem] = []
    for row in results:
        assignment = row[0]
        items.append(
            SurveyProgressItem(
                assignment_id=assignment.assignment_id,
                student_code=row.student_code,
                student_name=row.student_name,
                section_code=row.section_code,
                course_name=row.course_name,
                lecturer_name=row.lecturer_name,
                status=assignment.status_survey_assignment,
                assigned_at=assignment.assigned_survey_assignment,
                completed_at=assignment.completed_survey_assignment,
            )
        )
    return items