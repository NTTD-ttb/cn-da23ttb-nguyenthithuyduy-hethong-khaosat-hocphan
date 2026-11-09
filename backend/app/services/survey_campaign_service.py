"""Nghiệp vụ Đợt khảo sát & Tự động phân công khảo sát."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.academic_term import AcademicTerm
from app.models.import_batch import CourseEnrollment
from app.models.course import CourseSection
from app.models.survey import SurveyCampaign, SurveyTemplate, SurveyAssignment
from app.schemas.survey import SurveyCampaignCreate, SurveyCampaignUpdateStatus


def get_all_campaigns(db: Session, skip: int = 0, limit: int = 100) -> list[SurveyCampaign]:
    return db.query(SurveyCampaign).order_by(SurveyCampaign.created_survey_campaigns.desc()).offset(skip).limit(limit).all()


def get_campaign_by_id(db: Session, campaign_id: int) -> SurveyCampaign:
    campaign = db.get(SurveyCampaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy đợt khảo sát ID={campaign_id}.")
    return campaign


def create_campaign(db: Session, data: SurveyCampaignCreate, admin_id: int) -> SurveyCampaign:
    if not db.get(AcademicTerm, data.term_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Học kỳ không tồn tại.")
    if not db.get(SurveyTemplate, data.template_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bộ câu hỏi không tồn tại.")

    existing = db.query(SurveyCampaign).filter(SurveyCampaign.term_id == data.term_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Học kỳ này đã có một đợt khảo sát.")

    campaign = SurveyCampaign(**data.model_dump(), created_by=admin_id)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Nếu trạng thái tạo mới là 'open', sinh assignment ngay
    if campaign.status == "open":
        generate_assignments_for_campaign(db, campaign)

    return campaign


def update_campaign_status(db: Session, campaign_id: int, data: SurveyCampaignUpdateStatus) -> SurveyCampaign:
    campaign = get_campaign_by_id(db, campaign_id)
    old_status = campaign.status
    new_status = data.status

    campaign.status = new_status
    db.commit()
    db.refresh(campaign)

    # Khi chuyển trạng thái sang OPEN lần đầu tiên, tự động sinh danh sách lượt làm bài
    if old_status != "open" and new_status == "open":
        generate_assignments_for_campaign(db, campaign)

    return campaign


def generate_assignments_for_campaign(db: Session, campaign: SurveyCampaign) -> int:
    """Tự động sinh các bản ghi survey_assignments dựa trên danh sách sinh viên đăng ký môn."""
    # Tìm tất cả enrollments thuộc học kỳ của campaign này
    enrollments = (
        db.query(CourseEnrollment)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .filter(CourseSection.term_id == campaign.term_id)
        .all()
    )

    created_count = 0
    for enr in enrollments:
        exists = db.query(SurveyAssignment).filter(
            SurveyAssignment.campaign_id == campaign.campaign_id,
            SurveyAssignment.enrollment_id == enr.enrollment_id,
        ).first()

        if not exists:
            assignment = SurveyAssignment(
                campaign_id=campaign.campaign_id,
                enrollment_id=enr.enrollment_id,
                status_survey_assignment="not_started",
            )
            db.add(assignment)
            created_count += 1

    db.commit()
    return created_count