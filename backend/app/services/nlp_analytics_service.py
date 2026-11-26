"""Aggregated NLP analytics and anonymous feedback search."""

from collections import Counter, defaultdict
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Course, CourseSection
from app.models.import_batch import CourseEnrollment
from app.models.lecturer import Lecturer
from app.models.nlp import (
    FeedbackAnalysis,
    FeedbackTopic,
    SentimentLabel,
    TopicLabel,
)
from app.models.survey import (
    SurveyAnswer,
    SurveyAssignment,
    SurveyCampaign,
    SurveyResponse,
)


def _percentage(count: int, total: int) -> float:
    return round(count / total * 100, 2) if total else 0.0


def _build_sentiment_details(
    labels: list[SentimentLabel],
    counts: Counter,
) -> list[dict[str, Any]]:
    total = sum(counts.values())
    return [
        {
            "sentiment_code": label.sentiment_code,
            "sentiment_name": label.sentiment_name,
            "count": counts[label.sentiment_code],
            "percentage": _percentage(counts[label.sentiment_code], total),
        }
        for label in labels
    ]


def _build_topic_details(
    labels: list[TopicLabel],
    counts: Counter,
) -> list[dict[str, Any]]:
    total = sum(counts.values())
    return [
        {
            "topic_code": label.topic_code,
            "topic_name": label.topic_name,
            "count": counts[label.topic_code],
            "percentage": _percentage(counts[label.topic_code], total),
        }
        for label in labels
    ]


def _build_topic_sentiments(
    topic_labels: list[TopicLabel],
    sentiment_labels: list[SentimentLabel],
    topic_counts: dict[str, Counter],
) -> list[dict[str, Any]]:
    rows = []
    for topic in topic_labels:
        counts = topic_counts[topic.topic_code]
        total = sum(counts.values())
        rows.append(
            {
                "topic_code": topic.topic_code,
                "topic_name": topic.topic_name,
                "total_mentions": total,
                "details": [
                    {
                        "sentiment_code": sentiment.sentiment_code,
                        "sentiment_name": sentiment.sentiment_name,
                        "count": counts[sentiment.sentiment_code],
                        "percentage": _percentage(
                            counts[sentiment.sentiment_code], total
                        ),
                    }
                    for sentiment in sentiment_labels
                ],
            }
        )
    return rows


def _build_group_summary(
    group: dict[str, Any],
    sentiment_labels: list[SentimentLabel],
    topic_labels: list[TopicLabel],
) -> dict[str, Any]:
    sentiment_counts = group["sentiments"]
    labeled_total = sum(sentiment_counts.values())
    teaching_counts = group["teaching_sentiments"]
    teaching_labeled_total = sum(teaching_counts.values())
    topic_details = _build_topic_details(topic_labels, group["topics"])
    topic_details.sort(key=lambda item: (-item["count"], item["topic_name"]))
    negative_count = sentiment_counts.get("negative", 0)
    return {
        **group["identity"],
        "total_comments": group["total_comments"],
        "analyzed_comments": group["analyzed_comments"],
        "negative_percentage": _percentage(negative_count, labeled_total),
        "teaching_comments": group["teaching_comments"],
        "teaching_negative_percentage": _percentage(
            teaching_counts.get("negative", 0), teaching_labeled_total
        ),
        "sentiment_counts": {
            label.sentiment_code: sentiment_counts[label.sentiment_code]
            for label in sentiment_labels
        },
        "top_topics": topic_details[:3],
    }


def get_campaign_analytics(
    db: Session,
    campaign_id: int,
    course_id: int | None = None,
) -> dict[str, Any]:
    campaign = db.get(SurveyCampaign, campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đợt khảo sát không tồn tại.",
        )

    query = (
        db.query(
            SurveyAnswer.answer_id,
            Course.course_id,
            Course.course_code,
            Course.course_name,
            Lecturer.lecturer_id,
            Lecturer.full_name,
            FeedbackAnalysis.analysis_id,
            SentimentLabel.sentiment_code,
        )
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .outerjoin(FeedbackAnalysis, SurveyAnswer.answer_id == FeedbackAnalysis.answer_id)
        .outerjoin(SentimentLabel, FeedbackAnalysis.sentiment_id == SentimentLabel.sentiment_id)
        .filter(
            SurveyAssignment.campaign_id == campaign_id,
            SurveyAnswer.answer_text.isnot(None),
            SurveyAnswer.answer_text != "",
        )
    )
    if course_id is not None:
        query = query.filter(Course.course_id == course_id)

    rows = query.all()
    sentiment_labels = db.query(SentimentLabel).order_by(SentimentLabel.sentiment_id).all()
    topic_labels = db.query(TopicLabel).order_by(TopicLabel.topic_id).all()
    analysis_ids = [row.analysis_id for row in rows if row.analysis_id is not None]

    topic_rows = []
    if analysis_ids:
        topic_rows = (
            db.query(
                FeedbackTopic.analysis_id,
                TopicLabel.topic_code,
                TopicLabel.topic_name,
                FeedbackTopic.topic_confidence,
            )
            .join(TopicLabel, FeedbackTopic.topic_id == TopicLabel.topic_id)
            .filter(FeedbackTopic.analysis_id.in_(analysis_ids))
            .all()
        )

    topic_by_analysis: dict[int, list[dict[str, Any]]] = defaultdict(list)
    topic_counts: dict[str, Counter] = defaultdict(Counter)
    topic_sentiment_counts: dict[str, Counter] = defaultdict(Counter)
    for row in topic_rows:
        topic_by_analysis[row.analysis_id].append(
            {
                "topic_code": row.topic_code,
                "topic_name": row.topic_name,
                "confidence": (
                    float(row.topic_confidence)
                    if row.topic_confidence is not None
                    else None
                ),
            }
        )
        topic_counts[row.topic_code]["count"] += 1

    sentiment_by_analysis = {
        row.analysis_id: row.sentiment_code
        for row in rows
        if row.analysis_id is not None and row.sentiment_code
    }
    for topic_row in topic_rows:
        sentiment_code = sentiment_by_analysis.get(topic_row.analysis_id)
        if sentiment_code:
            topic_sentiment_counts[topic_row.topic_code][sentiment_code] += 1

    overall_sentiments: Counter = Counter()
    course_groups: dict[int, dict[str, Any]] = {}
    lecturer_groups: dict[tuple[int, int], dict[str, Any]] = {}
    lecturers_by_course: dict[int, set[str]] = defaultdict(set)

    assigned_courses_query = (
        db.query(
            Course.course_id,
            Course.course_code,
            Course.course_name,
            Lecturer.lecturer_id,
            Lecturer.full_name,
        )
        .join(CourseSection, Course.course_id == CourseSection.course_id)
        .join(CourseEnrollment, CourseSection.section_id == CourseEnrollment.section_id)
        .join(SurveyAssignment, CourseEnrollment.enrollment_id == SurveyAssignment.enrollment_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .filter(SurveyAssignment.campaign_id == campaign_id)
        .distinct()
    )
    if course_id is not None:
        assigned_courses_query = assigned_courses_query.filter(Course.course_id == course_id)

    for assigned_course in assigned_courses_query.all():
        course_groups.setdefault(
            assigned_course.course_id,
            {
                "identity": {
                    "course_id": assigned_course.course_id,
                    "course_code": assigned_course.course_code,
                    "course_name": assigned_course.course_name,
                    "lecturers": [],
                },
                "total_comments": 0,
                "analyzed_comments": 0,
                "sentiments": Counter(),
                "topics": Counter(),
                "teaching_sentiments": Counter(),
                "teaching_comments": 0,
            },
        )
        lecturers_by_course[assigned_course.course_id].add(assigned_course.full_name)

    for row in rows:
        course_group = course_groups.setdefault(
            row.course_id,
            {
                "identity": {
                    "course_id": row.course_id,
                    "course_code": row.course_code,
                    "course_name": row.course_name,
                    "lecturers": [],
                },
                "total_comments": 0,
                "analyzed_comments": 0,
                "sentiments": Counter(),
                "topics": Counter(),
                "teaching_sentiments": Counter(),
                "teaching_comments": 0,
            },
        )
        course_group["total_comments"] += 1
        lecturers_by_course[row.course_id].add(row.full_name)

        lecturer_key = (row.course_id, row.lecturer_id)
        lecturer_group = lecturer_groups.setdefault(
            lecturer_key,
            {
                "identity": {
                    "course_id": row.course_id,
                    "course_code": row.course_code,
                    "course_name": row.course_name,
                    "lecturer_id": row.lecturer_id,
                    "lecturer_name": row.full_name,
                },
                "total_comments": 0,
                "analyzed_comments": 0,
                "sentiments": Counter(),
                "topics": Counter(),
                "teaching_sentiments": Counter(),
                "teaching_comments": 0,
            },
        )
        lecturer_group["total_comments"] += 1

        if row.analysis_id is None:
            continue

        course_group["analyzed_comments"] += 1
        lecturer_group["analyzed_comments"] += 1
        if row.sentiment_code:
            overall_sentiments[row.sentiment_code] += 1
            course_group["sentiments"][row.sentiment_code] += 1
            lecturer_group["sentiments"][row.sentiment_code] += 1
        analysis_topics = topic_by_analysis.get(row.analysis_id, [])
        if any(topic["topic_code"] == "teaching" for topic in analysis_topics):
            course_group["teaching_comments"] += 1
            lecturer_group["teaching_comments"] += 1
            if row.sentiment_code:
                course_group["teaching_sentiments"][row.sentiment_code] += 1
                lecturer_group["teaching_sentiments"][row.sentiment_code] += 1
        for topic in analysis_topics:
            course_group["topics"][topic["topic_code"]] += 1
            lecturer_group["topics"][topic["topic_code"]] += 1

    for course_id_value, group in course_groups.items():
        group["identity"]["lecturers"] = sorted(lecturers_by_course[course_id_value])

    analyzed_comments = sum(1 for row in rows if row.analysis_id is not None)
    total_comments = len(rows)

    return {
        "campaign_id": campaign_id,
        "course_id": course_id,
        "total_comments": total_comments,
        "analyzed_comments": analyzed_comments,
        "pending_comments": total_comments - analyzed_comments,
        "sentiment_details": _build_sentiment_details(
            sentiment_labels, overall_sentiments
        ),
        "topic_details": _build_topic_details(
            topic_labels, Counter({key: value["count"] for key, value in topic_counts.items()})
        ),
        "topic_sentiments": _build_topic_sentiments(
            topic_labels, sentiment_labels, topic_sentiment_counts
        ),
        "courses": [
            _build_group_summary(group, sentiment_labels, topic_labels)
            for group in sorted(
                course_groups.values(),
                key=lambda item: item["identity"]["course_name"].lower(),
            )
        ],
        "course_lecturers": [
            _build_group_summary(group, sentiment_labels, topic_labels)
            for group in sorted(
                lecturer_groups.values(),
                key=lambda item: (
                    item["identity"]["course_name"].lower(),
                    item["identity"]["lecturer_name"].lower(),
                ),
            )
        ],
    }


def search_feedback(
    db: Session,
    campaign_id: int,
    course_id: int | None = None,
    sentiment: str | None = None,
    topic: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> dict[str, Any]:
    query = (
        db.query(
            FeedbackAnalysis,
            SurveyAnswer.answer_text,
            SentimentLabel.sentiment_name,
            Course.course_id,
            Course.course_code,
            Course.course_name,
            CourseSection.section_code,
            Lecturer.full_name.label("lecturer_name"),
        )
        .join(SurveyAnswer, FeedbackAnalysis.answer_id == SurveyAnswer.answer_id)
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
        .join(CourseEnrollment, SurveyAssignment.enrollment_id == CourseEnrollment.enrollment_id)
        .join(CourseSection, CourseEnrollment.section_id == CourseSection.section_id)
        .join(Course, CourseSection.course_id == Course.course_id)
        .join(Lecturer, CourseSection.lecturer_id == Lecturer.lecturer_id)
        .outerjoin(SentimentLabel, FeedbackAnalysis.sentiment_id == SentimentLabel.sentiment_id)
        .filter(
            SurveyAssignment.campaign_id == campaign_id,
            SurveyAnswer.answer_text.isnot(None),
            SurveyAnswer.answer_text != "",
        )
    )
    if course_id is not None:
        query = query.filter(Course.course_id == course_id)
    if sentiment:
        query = query.filter(SentimentLabel.sentiment_code == sentiment)
    if topic:
        query = (
            query.join(FeedbackTopic, FeedbackAnalysis.analysis_id == FeedbackTopic.analysis_id)
            .join(TopicLabel, FeedbackTopic.topic_id == TopicLabel.topic_id)
            .filter(TopicLabel.topic_code == topic)
        )
    if search:
        query = query.filter(SurveyAnswer.answer_text.ilike(f"%{search.strip()}%"))

    total = query.order_by(None).count()
    results = (
        query.order_by(FeedbackAnalysis.analysis_id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    analysis_ids = [row[0].analysis_id for row in results]
    topic_by_analysis: dict[int, list[dict[str, Any]]] = defaultdict(list)
    if analysis_ids:
        topic_rows = (
            db.query(
                FeedbackTopic.analysis_id,
                TopicLabel.topic_code,
                TopicLabel.topic_name,
                FeedbackTopic.topic_confidence,
            )
            .join(TopicLabel, FeedbackTopic.topic_id == TopicLabel.topic_id)
            .filter(FeedbackTopic.analysis_id.in_(analysis_ids))
            .all()
        )
        for row in topic_rows:
            topic_by_analysis[row.analysis_id].append(
                {
                    "topic_code": row.topic_code,
                    "topic_name": row.topic_name,
                    "confidence": (
                        float(row.topic_confidence)
                        if row.topic_confidence is not None
                        else None
                    ),
                }
            )

    items = []
    for row in results:
        analysis, original_text, sentiment_name, course_id_value, course_code, course_name, section_code, lecturer_name = row
        items.append(
            {
                "analysis_id": analysis.analysis_id,
                "original_text": original_text,
                "cleaned_text": analysis.cleaned_text,
                "sentiment": sentiment_name or "Chưa xác định",
                "sentiment_confidence": (
                    float(analysis.sentiment_confidence)
                    if analysis.sentiment_confidence is not None
                    else None
                ),
                "topics": [
                    item["topic_name"]
                    for item in topic_by_analysis.get(analysis.analysis_id, [])
                ],
                "topic_details": topic_by_analysis.get(analysis.analysis_id, []),
                "course_id": course_id_value,
                "course_code": course_code,
                "course_name": course_name,
                "section_code": section_code,
                "lecturer_name": lecturer_name,
            }
        )
    return {"total": total, "items": items}
