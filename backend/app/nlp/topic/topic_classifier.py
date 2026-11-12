"""
Module Phân loại Đa nhãn Chủ đề (Multi-label Topic Classification).

Đặc điểm:
- Sử dụng mô hình Zero-shot Classification của Transformers hỗ trợ tiếng Việt xuất sắc.
- Nhận diện đồng thời nhiều chủ đề (Multi-label) trong 7 chủ đề chuẩn của hệ thống:
  + content: Nội dung môn học
  + teaching: Phương pháp giảng dạy
  + material: Tài liệu học tập (slide, giáo trình)
  + assignment: Bài tập, bài tập lớn
  + practice: Thực hành, phòng lab, máy tính
  + assessment: Thi cử, kiểm tra, chấm điểm
  + other: Vấn đề khác
- Áp dụng Singleton Pattern (chỉ nạp mô hình lên RAM 1 lần duy nhất).
"""

from typing import Any
from transformers import pipeline

from app.nlp.preprocessing.text_cleaner import clean_text

# Mô hình Zero-shot NLI đa ngôn ngữ hiểu tiếng Việt cực kỳ tốt, nhẹ và chính xác cao
ZERO_SHOT_MODEL = "MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"

# Danh sách 7 nhãn mô tả tiếng Việt ứng với topic_code trong Database
TOPIC_CANDIDATES = [
    "nội dung môn học",
    "phương pháp giảng dạy của giảng viên",
    "tài liệu học tập và slide bài giảng",
    "bài tập và bài tập lớn",
    "thực hành và phòng máy tính",
    "kiểm tra và thi cử chấm điểm",
    "vấn đề khác",
]

# Ánh xạ từ nhãn mô tả tiếng Việt sang topic_code trong bảng topic_labels
TOPIC_LABEL_MAPPING = {
    "nội dung môn học": "content",
    "phương pháp giảng dạy của giảng viên": "teaching",
    "tài liệu học tập và slide bài giảng": "material",
    "bài tập và bài tập lớn": "assignment",
    "thực hành và phòng máy tính": "practice",
    "kiểm tra và thi cử chấm điểm": "assessment",
    "vấn đề khác": "other",
}

# Ngưỡng tin cậy tối thiểu để chấp nhận 1 chủ đề (trên 0.35 được coi là có đề cập)
CONFIDENCE_THRESHOLD = 0.35


class TopicClassifier:
    """Class quản lý mô hình phân loại chủ đề theo Singleton Pattern."""

    _instance = None
    _classifier = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TopicClassifier, cls).__new__(cls)
            print(">>> [Topic-Classifier] Đang nạp mô hình Zero-shot lên RAM...")
            cls._classifier = pipeline(
                "zero-shot-classification",
                model=ZERO_SHOT_MODEL,
                tokenizer=ZERO_SHOT_MODEL,
            )
            print(">>> [Topic-Classifier] Nạp mô hình chủ đề thành công!")
        return cls._instance

    def predict(self, raw_text: str) -> list[dict[str, Any]]:
        """
        Dự đoán các chủ đề xuất hiện trong câu nhận xét.

        Returns:
            list[dict]: Danh sách các chủ đề được chọn kèm độ tin cậy.
            Ví dụ: [
                {"topic_code": "teaching", "confidence": 0.92},
                {"topic_code": "material", "confidence": 0.78}
            ]
        """
        if not raw_text or not raw_text.strip():
            return []

        cleaned = clean_text(raw_text)
        if not cleaned:
            return []

        # Chạy phân loại đa nhãn (multi_label=True)
        result = self._classifier(
            cleaned,
            candidate_labels=TOPIC_CANDIDATES,
            multi_label=True,
        )

        labels = result.get("labels", [])
        scores = result.get("scores", [])

        detected_topics: list[dict[str, Any]] = []

        for label, score in zip(labels, scores):
            if score >= CONFIDENCE_THRESHOLD:
                topic_code = TOPIC_LABEL_MAPPING.get(label, "other")
                detected_topics.append({
                    "topic_code": topic_code,
                    "confidence": round(float(score), 4),
                })

        # Nếu không có chủ đề nào vượt ngưỡng, mặc định gán nhãn 'other'
        if not detected_topics and labels:
            detected_topics.append({
                "topic_code": "other",
                "confidence": round(float(scores[-1]), 4),
            })

        return detected_topics


# Khởi tạo đối tượng Singleton dùng chung
topic_analyzer = TopicClassifier()


def predict_topics(text: str) -> list[dict[str, Any]]:
    """Hàm tiện ích gọi nhanh từ Pipeline."""
    return topic_analyzer.predict(text)