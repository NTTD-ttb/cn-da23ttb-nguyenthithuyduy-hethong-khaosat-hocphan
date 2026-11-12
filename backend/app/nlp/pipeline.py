"""
Pipeline Tích hợp Xử lý NLP Phản hồi Sinh viên.

Quy trình:
1. Nhận câu trả lời văn bản (answer_id, raw_text).
2. Tiền xử lý teencode bằng text_cleaner (Tuần 9).
3. Dự đoán cảm xúc bằng PhoBERT (Tuần 10).
4. Dự đoán đa nhãn chủ đề bằng Zero-shot (Tuần 11).
5. Lưu kết quả vào 2 bảng CSDL:
   - feedback_analyses (analysis_id, answer_id, cleaned_text, sentiment_id, confidence)
   - feedback_topics (analysis_id, topic_id, topic_confidence)
"""

from typing import Any
from sqlalchemy.orm import Session

from app.models.survey import SurveyAnswer
from app.models.nlp import SentimentLabel, TopicLabel, FeedbackAnalysis, FeedbackTopic
from app.nlp.preprocessing.text_cleaner import clean_text
from app.nlp.sentiment.phobert_sentiment import predict_sentiment
from app.nlp.topic.topic_classifier import predict_topics


def analyze_single_answer(db: Session, answer_id: int) -> dict[str, Any] | None:
    """
    Phân tích 1 câu trả lời văn bản và lưu kết quả vào Database.
    """
    answer = db.get(SurveyAnswer, answer_id)
    if not answer or not answer.answer_text or not answer.answer_text.strip():
        return None

    # Nếu câu này đã phân tích trước đó, bỏ qua để tránh trùng lặp
    existing = db.query(FeedbackAnalysis).filter(FeedbackAnalysis.answer_id == answer_id).first()
    if existing:
        return None

    raw_text = answer.answer_text

    # 1. Làm sạch văn bản
    cleaned = clean_text(raw_text)

    # 2. Phân tích cảm xúc qua PhoBERT
    sentiment_res = predict_sentiment(cleaned)
    sentiment_code = sentiment_res["sentiment_code"]
    sentiment_conf = sentiment_res["confidence"]

    # Tìm sentiment_id trong Database
    sentiment_obj = db.query(SentimentLabel).filter(SentimentLabel.sentiment_code == sentiment_code).first()
    sentiment_id = sentiment_obj.sentiment_id if sentiment_obj else None

    # 3. Phân loại chủ đề (Multi-label)
    topics_res = predict_topics(cleaned)

    # 4. Lưu bản ghi vào bảng feedback_analyses
    analysis = FeedbackAnalysis(
        answer_id=answer_id,
        cleaned_text=cleaned,
        sentiment_id=sentiment_id,
        sentiment_confidence=sentiment_conf,
        model_version="PhoBERT-Sentiment + ZeroShot-Topic",
    )
    db.add(analysis)
    db.flush()  # Để sinh ra analysis.analysis_id

    # 5. Lưu các chủ đề vào bảng feedback_topics
    for item in topics_res:
        t_code = item["topic_code"]
        t_conf = item["confidence"]

        topic_obj = db.query(TopicLabel).filter(TopicLabel.topic_code == t_code).first()
        if topic_obj:
            feedback_topic = FeedbackTopic(
                analysis_id=analysis.analysis_id,
                topic_id=topic_obj.topic_id,
                topic_confidence=t_conf,
            )
            db.add(feedback_topic)

    db.commit()

    return {
        "analysis_id": analysis.analysis_id,
        "answer_id": answer_id,
        "sentiment": sentiment_code,
        "confidence": sentiment_conf,
        "topics": [t["topic_code"] for t in topics_res],
    }


def analyze_campaign_feedbacks(db: Session, campaign_id: int) -> dict[str, int]:
    """
    Quét và phân tích tự động toàn bộ phản hồi văn bản trong một đợt khảo sát.
    """
    from app.models.survey import SurveyAssignment, SurveyResponse

    # Tìm tất cả answer_id có chứa văn bản thuộc campaign_id và CHƯA được phân tích
    unprocessed_answers = (
        db.query(SurveyAnswer.answer_id)
        .join(SurveyResponse, SurveyAnswer.response_id == SurveyResponse.response_id)
        .join(SurveyAssignment, SurveyResponse.assignment_id == SurveyAssignment.assignment_id)
        .outerjoin(FeedbackAnalysis, SurveyAnswer.answer_id == FeedbackAnalysis.answer_id)
        .filter(
            SurveyAssignment.campaign_id == campaign_id,
            SurveyAnswer.answer_text.isnot(None),
            SurveyAnswer.answer_text != "",
            FeedbackAnalysis.analysis_id.is_(None),  # Chưa phân tích
        )
        .all()
    )

    processed_count = 0
    for row in unprocessed_answers:
        ans_id = row[0]
        res = analyze_single_answer(db, ans_id)
        if res:
            processed_count += 1

    return {
        "total_unprocessed": len(unprocessed_answers),
        "successfully_processed": processed_count,
    }