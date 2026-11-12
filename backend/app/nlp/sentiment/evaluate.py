"""
Script Đánh giá Độ chính xác của Mô hình PhoBERT Sentiment
trên Tập Dữ liệu Thực nghiệm (student_feedbacks.csv).

Cách chạy:
    cd D:\\TTCN\\Hethongkhaosat\\backend
    .\\.venv\\Scripts\\Activate.ps1
    python app/nlp/sentiment/evaluate.py
"""

from pathlib import Path
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from app.nlp.sentiment.phobert_sentiment import predict_sentiment

# Đường dẫn tới file CSV dữ liệu mẫu Tuần 9
DATASET_PATH = Path(__file__).resolve().parent.parent / "datasets" / "student_feedbacks.csv"


def run_evaluation():
    print(f"==================================================")
    print(f"ĐÁNH GIÁ MÔ HÌNH PHOBERT PHÂN TÍCH CẢM XÚC")
    print(f"File dữ liệu: {DATASET_PATH.name}")
    print(f"==================================================")

    if not DATASET_PATH.exists():
        print(f"LỖI: Không tìm thấy file dữ liệu tại {DATASET_PATH}")
        return

    # 1. Đọc file CSV
    df = pd.read_csv(DATASET_PATH)
    total_samples = len(df)
    print(f"Tổng số mẫu câu đánh giá: {total_samples}")

    y_true = df["sentiment"].tolist()
    y_pred = []
    confidences = []

    # 2. Chạy dự đoán từng câu qua PhoBERT
    print("\nĐang tiến hành phân tích qua PhoBERT...")
    for idx, row in df.iterrows():
        text = str(row["feedback_text"])
        res = predict_sentiment(text)
        pred_label = res["sentiment_code"]
        y_pred.append(pred_label)
        confidences.append(res["confidence"])

    # 3. Tính toán các chỉ số khoa học
    acc = accuracy_score(y_true, y_pred)
    avg_conf = sum(confidences) / len(confidences)

    print(f"\n" + "="*50)
    print(f"KẾT QUẢ THỰC NGHIỆM")
    print(f"="*50)
    print(f"Độ chính xác tổng thể (Accuracy) : {acc * 100:.2f}%")
    print(f"Độ tin cậy trung bình (Confidence): {avg_conf * 100:.2f}%")

    # Bảng chi tiết Precision, Recall, F1-Score
    labels = ["positive", "neutral", "negative"]
    target_names = ["Tích cực (Positive)", "Trung tính (Neutral)", "Tiêu cực (Negative)"]
    
    print("\nBẢNG BÁO CÁO CHI TIẾT (CLASSIFICATION REPORT):")
    print(classification_report(y_true, y_pred, labels=labels, target_names=target_names, digits=4))

    print("MA TRẬN NHẦM LẪN (CONFUSION MATRIX):")
    print(confusion_matrix(y_true, y_pred, labels=labels))
    print(f"Thứ tự nhãn: {labels}")
    print("="*50)


if __name__ == "__main__":
    run_evaluation()