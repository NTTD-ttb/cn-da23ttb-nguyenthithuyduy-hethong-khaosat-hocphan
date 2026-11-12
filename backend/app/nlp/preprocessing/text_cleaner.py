"""
Module Tiền xử lý và Chuẩn hóa văn bản Tiếng Việt cho phản hồi sinh viên.

Quy trình:
1. Chuẩn hóa bảng mã Unicode (NFC).
2. Chuyển về chữ thường (lowercase).
3. Chuẩn hóa ký tự lặp vô nghĩa (vd: "quáaaaa" -> "quá").
4. Dịch từ điển Teencode / Viết tắt phổ biến của sinh viên.
5. Làm sạch khoảng trắng và dấu câu.
"""

import re
import unicodedata

# Từ điển ánh xạ từ viết tắt / teencode sinh viên sang tiếng Việt chuẩn
TEENCODE_DICT: dict[str, str] = {
    # Danh từ đào tạo
    "gv": "giảng viên",
    "thầy": "giảng viên",
    "cô": "giảng viên",
    "sv": "sinh viên",
    "hp": "học phần",
    "mh": "môn học",
    "bt": "bài tập",
    "btl": "bài tập lớn",
    "kt": "kiểm tra",
    "thi": "kiểm tra",
    "slide": "tài liệu",
    "doc": "tài liệu",
    "lab": "thực hành",
    "th": "thực hành",
    "cntt": "công nghệ thông tin",
    
    # Từ phủ định & liên từ
    "k": "không",
    "ko": "không",
    "kh": "không",
    "khong": "không",
    "hem": "không",
    "hông": "không",
    "nma": "nhưng mà",
    "nhung": "nhưng",
    "vs": "với",
    "va": "và",
    "dc": "được",
    "đc": "được",
    "hok": "học",
    
    # Tính từ & trạng từ & từ lóng
    "ok": "tốt",
    "oke": "tốt",
    "okela": "tốt",
    "good": "tốt",
    "nhìu": "nhiều",
    "r": "rồi",
    "rùi": "rồi",
    "wa": "quá",
    "qúa": "quá",
    "lun": "luôn",
    "z": "vậy",
    "nhiet tinh": "nhiệt tình",
    "cuốn": "hấp dẫn",
    "cuốn xỉu": "rất hấp dẫn",
    "xỉu": "rất nhiều",
    "gắt": "khó tính",
    "căng": "khó khăn",
    "vãi": "rất",
    "vler": "rất",
    "support": "hỗ trợ",
    "tâm huyết": "nhiệt tình",
}


def normalize_unicode(text: str) -> str:
    """Chuẩn hóa văn bản về bảng mã Unicode dạng NFC (dựng sẵn chuẩn của tiếng Việt)."""
    return unicodedata.normalize("NFC", text)


def remove_repetitive_characters(text: str) -> str:
    """
    Rút gọn các ký tự bị lặp kéo dài từ 3 lần trở lên.
    Ví dụ: 'dễ ẹkkkkk' -> 'dễ ẹk', 'quaaaa' -> 'quá'.
    """
    # Thay thế các ký tự lặp 3 lần liên tiếp trở lên bằng 1 ký tự
    return re.sub(r"([a-zA-Zà-ỹÀ-Ỹ])\1{2,}", r"\1", text)


def replace_teencode(text: str) -> str:
    """
    Thay thế các từ viết tắt, teencode theo từ điển định sẵn.
    Duyệt từng từ tách biệt để tránh thay thế nhầm vào giữa từ khác.
    """
    words = text.split()
    cleaned_words = [TEENCODE_DICT.get(word, word) for word in words]
    return " ".join(cleaned_words)


def clean_text(text: str) -> str:
    """
    Hàm pipeline chính: Thực hiện toàn bộ quy trình tiền xử lý văn bản tiếng Việt.

    Args:
        text (str): Câu nhận xét gốc của sinh viên.

    Returns:
        str: Câu tiếng Việt đã được làm sạch, chuẩn hóa chuẩn bị cho mô hình AI.
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Chuẩn hóa Unicode
    text = normalize_unicode(text)

    # 2. Chuyển về chữ thường
    text = text.lower().strip()

    # 3. Xóa các icon / biểu tượng cảm xúc dạng ký tự lạ (như :)), :D, <3, ^^)
    text = re.sub(r"[:;=8][\-o\*\']?[)\]\(\[dDpP/:\}\{@\|\\]", " ", text)
    text = re.sub(r"[\^~_><]+", " ", text)

    # 4. Rút gọn ký tự lặp vô nghĩa
    text = remove_repetitive_characters(text)

    # 5. Dịch từ điển viết tắt (Teencode)
    text = replace_teencode(text)

    # 6. Loại bỏ ký tự đặc biệt thừa nhưng giữ lại chữ tiếng Việt có dấu và dấu chấm, phẩy
    text = re.sub(r"[^\w\s\.,]", " ", text)

    # 7. Chuẩn hóa khoảng trắng thừa
    text = re.sub(r"\s+", " ", text).strip()

    return text