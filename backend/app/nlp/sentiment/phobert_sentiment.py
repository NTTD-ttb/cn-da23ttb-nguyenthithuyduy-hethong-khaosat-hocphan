"""
Module Phân tích Cảm xúc Phản hồi Sinh viên sử dụng Mô hình PhoBERT.

Đặc điểm:
- Sử dụng mô hình Pre-trained PhoBERT tiếng Việt từ Hugging Face.
- Áp dụng mẫu thiết kế Singleton (chỉ nạp mô hình lên RAM 1 lần duy nhất).
- Kết hợp với text_cleaner (Tuần 9) để lọc sạch teencode trước khi phân tích.
- Trả về mã cảm xúc khớp 100% với CSDL: 'positive', 'negative', 'neutral'.
"""

from typing import Any
from transformers import pipeline

from app.nlp.preprocessing.text_cleaner import clean_text

# Tên mô hình PhoBERT chuyên về phân tích cảm xúc tiếng Việt trên Hugging Face
MODEL_NAME = "wonrax/phobert-base-vietnamese-sentiment"

# Ánh xạ nhãn của mô hình Hugging Face sang nhãn chuẩn của CSDL hệ thống
LABEL_MAPPING = {
    "POS": "positive",  # Tích cực
    "NEG": "negative",  # Tiêu cực
    "NEU": "neutral",   # Trung tính
}


class PhoBertSentimentClassifier:
    """Class quản lý mô hình PhoBERT theo mô hình Singleton."""

    _instance = None
    _classifier = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PhoBertSentimentClassifier, cls).__new__(cls)
            print(">>> [PhoBERT] Đang nạp mô hình cảm xúc tiếng Việt lên RAM...")
            # Nạp mô hình (lần đầu sẽ tự động tải trọng số về cache máy)
            cls._classifier = pipeline(
                "sentiment-analysis",
                model=MODEL_NAME,
                tokenizer=MODEL_NAME,
            )
            print(">>> [PhoBERT] Nạp mô hình thành công! Sẵn sàng phân tích.")
        return cls._instance

    def predict(self, raw_text: str) -> dict[str, Any]:
        """
        Dự đoán cảm xúc của một câu nhận xét tiếng Việt.

        Args:
            raw_text (str): Câu phản hồi gốc của sinh viên.

        Returns:
            dict: {
                "sentiment_code": "positive" | "negative" | "neutral",
                "confidence": float (0.0 đến 1.0),
                "cleaned_text": str (câu sau khi làm sạch teencode)
            }
        """
        if not raw_text or not raw_text.strip():
            return {
                "sentiment_code": "neutral",
                "confidence": 0.0,
                "cleaned_text": "",
            }

        # 1. Làm sạch văn bản bằng text_cleaner ở Tuần 9
        cleaned = clean_text(raw_text)
        if not cleaned:
            return {
                "sentiment_code": "neutral",
                "confidence": 0.0,
                "cleaned_text": "",
            }

        # 2. Đưa câu đã làm sạch vào mô hình PhoBERT
        # PhoBERT xử lý tối đa 256 tokens cho câu ngắn để tốc độ nhanh nhất
        results = self._classifier(cleaned, truncation=True, max_length=256)
        top_result = results[0]

        # 3. Chuyển đổi nhãn về chuẩn CSDL
        raw_label = top_result.get("label", "NEU")
        sentiment_code = LABEL_MAPPING.get(raw_label, "neutral")
        confidence = round(float(top_result.get("score", 0.0)), 4)

        return {
            "sentiment_code": sentiment_code,
            "confidence": confidence,
            "cleaned_text": cleaned,
        }


# Khởi tạo một đối tượng duy nhất (Singleton) dùng chung cho toàn bộ dự án
sentiment_analyzer = PhoBertSentimentClassifier()


def predict_sentiment(text: str) -> dict[str, Any]:
    """Hàm tiện ích gọi nhanh từ Router hoặc Service."""
    return sentiment_analyzer.predict(text)