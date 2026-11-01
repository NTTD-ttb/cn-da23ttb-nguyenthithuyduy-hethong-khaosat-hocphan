##Đề tài: Hệ thống thu thập và phân tích thông minh phản hồi của sinh viên về học phần đã học

Giảng viên hướng dẫn: TS. Nguyễn Nhứt Lam

Sinh viên thực hiện: Nguyễn Thị Thúy Duy

MSSV: 110123081

Lớp: DA23TTB

Hệ thống là website cho phép sinh viên đánh giá các học phần đã học (thang điểm + nhận xét
văn bản), sau đó phân tích phản hồi bằng NLP (phân tích cảm xúc, phân loại chủ đề) và
cung cấp dashboard thống kê cho quản trị viên.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React (Vite) + Chart.js |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2 |
| Cơ sở dữ liệu | PostgreSQL 17 |
| NLP / ML | pandas, scikit-learn, underthesea |
| Xử lý tệp | openpyxl, python-multipart |

## Cấu trúc thư mục

```
backend/
├── app/
│   ├── main.py            # Tạo FastAPI app, gắn middleware CORS, gắn router
│   ├── core/
│   │   ├── config.py      # Settings - đọc biến môi trường từ backend/.env
│   │   └── database.py    # engine, SessionLocal, Base, get_db()
│   ├── models/            # Model ORM (SQLAlchemy)
│   ├── schemas/           # Schema Pydantic (dữ liệu vào/ra của API)
│   ├── routers/           # Router chia theo student/ và admin/
│   ├── services/          # Nghiệp vụ (khảo sát, import, thống kê)
│   ├── nlp/               # Tiền xử lý, phân tích cảm xúc, phân loại chủ đề
│   └── utils/             # Tiện ích dùng chung
├── database/              # schema.sql, seed.sql (script CSDL)
├── tests/                 # unit/, integration/, fixtures/
├── storage/               # uploads/, exports/, avatars/ (không commit dữ liệu)
├── requirements.txt
└── .env                   # Cấu hình thật (không commit)
frontend/                  # Ứng dụng React
docs/                      # Tài liệu, sơ đồ, thiết kế API
thesis/, progress-report/  # Báo cáo và tài liệu đồ án
```

## Yêu cầu môi trường

- Python 3.12+
- PostgreSQL 17 (đang chạy, database `HeThongKhaoSat` đã được tạo)
- Node.js 20+ và npm (cho frontend)

## Chạy backend

Môi trường ảo nằm trong `backend/.venv` (không phải ở thư mục gốc).

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Tạo file cấu hình từ mẫu, sau đó điền DB_PASSWORD
Copy-Item .env.example .env

uvicorn app.main:app --reload --port 8000
```

Kiểm tra:

- Tài liệu API: http://127.0.0.1:8000/docs
- Kiểm tra kết nối CSDL: http://127.0.0.1:8000/api/health
  → kỳ vọng `{"status": "ok", "database": "connected", ...}`

## Biến môi trường (backend/.env)

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `DB_HOST` | Địa chỉ máy chủ PostgreSQL | `localhost` |
| `DB_PORT` | Cổng PostgreSQL | `5432` |
| `DB_NAME` | Tên cơ sở dữ liệu | `HeThongKhaoSat` |
| `DB_USER` | Tài khoản đăng nhập CSDL | `postgres` |
| `DB_PASSWORD` | Mật khẩu CSDL | — |
| `CORS_ORIGINS` | Origin frontend được phép gọi API, phân tách bằng dấu phẩy | `http://localhost:5173,http://127.0.0.1:5173` |

## Chạy frontend

Frontend đang được dựng ở giai đoạn tiếp theo. Khi có `package.json`:

```powershell
cd frontend
npm install
npm run dev
```

## Quy ước quan trọng

- `app/core/config.py` là nơi duy nhất đọc `.env`; `app/core/database.py` là nơi duy nhất
  tạo `engine`/`SessionLocal`/`Base`. Không đặt các thành phần này trong `main.py`
  và không import từ `app.main` trong model/router/service (tránh import vòng).
- Không commit `.env` và không commit nội dung `backend/storage/*`
  (chứa MSSV, họ tên, ảnh đại diện của sinh viên).
- Báo cáo phân tích không được hiển thị danh tính sinh viên.


