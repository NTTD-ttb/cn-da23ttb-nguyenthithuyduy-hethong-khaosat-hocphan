"""Nghiệp vụ Làm khảo sát của Sinh viên — Tầng Service."""

from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.survey import (
    SurveyAssignment,
    SurveyCampaign,
    SurveyTemplate,
    SurveyQuestion,
    SurveyResponse,
    SurveyAnswer,
)
from app.models.import_batch import CourseEnrollment
from app.models.course import CourseSection, Course
from app.models.lecturer import Lecturer
from app.models.academic_term import AcademicTerm
from app.schemas.student_survey import (
    StudentSurveyListItem,
    StudentSurveyDetailResponse,
    QuestionForStudent,
    CurrentAnswer,
    StudentSurveySubmitRequest,
    SurveySubmitSuccessResponse,
)


def get_student_surveys(
    db: Session,
    student_id: int,
    status_filter: str | None = None,
) -> list[StudentSurveyListItem]:
    """Lấy danh sách các môn học mà sinh viên được phân công khảo sát."""
    query = (
        db.query(
            SurveyAssignment,
            SurveyCampaign,
            Course,
            CourseSection,
            Lecturer,
            AcademicTerm,
        )
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(SurveyCampaign, SurveyAssignment.campaign_id == SurveyCampaign.campaign_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .join(AcademicTerm, CourseSection.term_id == AcademicTerm.term_id)
        .filter(CourseEnrollment.student_id == student_id)
        .filter(SurveyCampaign.status == "open")  # Chỉ lấy đợt đang mở
    )

    if status_filter:
        query = query.filter(SurveyAssignment.status_survey_assignment == status_filter)

    results = query.all()
    items: list[StudentSurveyListItem] = []
    for row in results:
        assignment, campaign, course, section, lecturer, term = row
        items.append(
            StudentSurveyListItem(
                assignment_id=assignment.assignment_id,
                campaign_id=campaign.campaign_id,
                campaign_name=campaign.campaign_name,
                course_code=course.course_code,
                course_name=course.course_name,
                section_code=section.section_code,
                lecturer_name=lecturer.full_name,
                term_name=term.term_name,
                academic_year=term.academic_year,
                status=assignment.status_survey_assignment,
                end_date=campaign.end_survey_campaigns,
            )
        )
    return items


def _get_assignment_and_verify_owner(
    db: Session, assignment_id: int, student_id: int
) -> tuple[SurveyAssignment, CourseSection, Course, Lecturer, AcademicTerm, SurveyCampaign]:
    """Kiểm tra tính hợp lệ và quyền sở hữu lượt khảo sát."""
    data = (
        db.query(
            SurveyAssignment,
            CourseSection,
            Course,
            Lecturer,
            AcademicTerm,
            SurveyCampaign,
        )
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .join(AcademicTerm, CourseSection.term_id == AcademicTerm.term_id)
        .join(SurveyCampaign, SurveyAssignment.campaign_id == SurveyCampaign.campaign_id)
        .filter(SurveyAssignment.assignment_id == assignment_id)
        .filter(CourseEnrollment.student_id == student_id)
        .first()
    )

    if not data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện bài khảo sát này hoặc khảo sát không tồn tại."
        )

    assignment, section, course, lecturer, term, campaign = data

    if campaign.status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đợt khảo sát này hiện chưa mở hoặc đã kết thúc."
        )

    return assignment, section, course, lecturer, term, campaign


def get_survey_detail(
    db: Session, assignment_id: int, student_id: int
) -> StudentSurveyDetailResponse:
    """Lấy thông tin chi tiết bài khảo sát: các câu hỏi và câu trả lời cũ (nếu có)."""
    assignment, section, course, lecturer, term, campaign = _get_assignment_and_verify_owner(
        db, assignment_id, student_id
    )

    # Lấy danh sách câu hỏi theo template
    questions = (
        db.query(SurveyQuestion)
        .filter(SurveyQuestion.template_id == campaign.template_id)
        .order_by(SurveyQuestion.display_order.asc())
        .all()
    )

    question_items = [
        QuestionForStudent(
            question_id=q.question_id,
            question_code=q.question_code,
            question_text=q.question_text,
            question_type=q.question_type,
            is_required=q.is_required,
            display_order=q.display_order,
            options_json=q.options_json,
            min_value=float(q.min_value) if q.min_value is not None else None,
            max_value=float(q.max_value) if q.max_value is not None else None,
        )
        for q in questions
    ]

    # Lấy các câu trả lời đã lưu nháp trước đó (nếu có)
    saved_answers: list[CurrentAnswer] = []
    response = db.query(SurveyResponse).filter(SurveyResponse.assignment_id == assignment_id).first()
    if response:
        answers = db.query(SurveyAnswer).filter(SurveyAnswer.response_id == response.response_id).all()
        saved_answers = [
            CurrentAnswer(
                question_id=a.question_id,
                answer_text=a.answer_text,
                answer_number=float(a.answer_number) if a.answer_number is not None else None,
                answer_json=a.answer_json,
            )
            for a in answers
        ]

    return StudentSurveyDetailResponse(
        assignment_id=assignment.assignment_id,
        status=assignment.status_survey_assignment,
        course_name=course.course_name,
        course_code=course.course_code,
        section_code=section.section_code,
        lecturer_name=lecturer.full_name,
        term_name=term.term_name,
        academic_year=term.academic_year,
        questions=question_items,
        saved_answers=saved_answers,
    )


def save_or_submit_survey(
    db: Session,
    assignment_id: int,
    student_id: int,
    data: StudentSurveySubmitRequest,
    is_submit: bool = False,
) -> SurveySubmitSuccessResponse:
    """Xử lý Lưu nháp (is_submit=False) hoặc Nộp bài chính thức (is_submit=True)."""
    assignment, _, _, _, _, campaign = _get_assignment_and_verify_owner(db, assignment_id, student_id)

    if assignment.status_survey_assignment == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã hoàn thành và nộp bài khảo sát này trước đó rồi, không thể sửa đổi."
        )

    # 1. Tìm hoặc tạo bản ghi SurveyResponse
    response = db.query(SurveyResponse).filter(SurveyResponse.assignment_id == assignment_id).first()
    now = datetime.now(timezone.utc)

    if not response:
        response = SurveyResponse(
            assignment_id=assignment_id,
            response_status="draft",
            started_survey_response=now,
            last_saved_survey_response=now,
        )
        db.add(response)
        db.flush()
    else:
        response.last_saved_survey_response = now

    # 2. Nếu là NỘP BÀI (Submit): Kiểm tra các câu hỏi bắt buộc (is_required)
    if is_submit:
        required_questions = (
            db.query(SurveyQuestion)
            .filter(SurveyQuestion.template_id == campaign.template_id, SurveyQuestion.is_required == True)
            .all()
        )
        answered_ids = {
            ans.question_id for ans in data.answers 
            if (ans.answer_text and ans.answer_text.strip()) or ans.answer_number is not None or ans.answer_json is not None
        }
        for rq in required_questions:
            if rq.question_id not in answered_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Câu hỏi bắt buộc '{rq.question_text}' chưa được trả lời."
                )

    # 3. Lưu hoặc cập nhật câu trả lời vào survey_answers
    for item in data.answers:
        answer = (
            db.query(SurveyAnswer)
            .filter(SurveyAnswer.response_id == response.response_id, SurveyAnswer.question_id == item.question_id)
            .first()
        )
        if not answer:
            answer = SurveyAnswer(
                response_id=response.response_id,
                question_id=item.question_id,
                answer_text=item.answer_text,
                answer_number=item.answer_number,
                answer_json=item.answer_json,
            )
            db.add(answer)
        else:
            answer.answer_text = item.answer_text
            answer.answer_number = item.answer_number
            answer.answer_json = item.answer_json

    # 4. Cập nhật trạng thái
    if is_submit:
        response.response_status = "submitted"
        response.submitted_survey_response = now
        assignment.status_survey_assignment = "completed"
        assignment.completed_survey_assignment = now
        msg = "Nộp bài khảo sát thành công!"
    else:
        assignment.status_survey_assignment = "in_progress"
        msg = "Lưu nháp thành công!"

    db.commit()

    return SurveySubmitSuccessResponse(
        assignment_id=assignment_id,
        message=msg,
        completed_at=now,
    )