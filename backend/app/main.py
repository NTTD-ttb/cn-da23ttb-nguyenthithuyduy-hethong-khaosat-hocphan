r"""
Điểm khởi chạy (entry point) của backend FastAPI.

Cách chạy (từ thư mục backend/):
    .\.venv\Scripts\Activate.ps1
    uvicorn app.main:app --reload --port 8000

Tài liệu API tự sinh: http://127.0.0.1:8000/docs

Ghi chú kiến trúc:
- Cấu hình (đọc từ .env)      -> app/core/config.py
- Kết nối CSDL                -> app/core/database.py
- File này CHỈ làm 3 việc: tạo app, gắn middleware, gắn router.
  Không đặt Settings/engine tại đây để router và model không phải import
  ngược lại file này (nguyên nhân gây lỗi import vòng).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import system
from app.routers import auth 
from app.routers.admin import (
    faculties,
    student_classes,
    lecturers,
    courses,
    course_sections,
    academic_terms,
    users,          
    import_data,
    survey_templates,  
    survey_campaigns,  
    survey_progress,    
    dashboard,         
    notifications,    
)

app = FastAPI(
    title="Hệ thống khảo sát học phần",
    description="API thu thập và phân tích phản hồi của sinh viên về học phần.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS: cho phép frontend React (mặc định http://localhost:5173) gọi API.
# Thiếu phần này, trình duyệt sẽ chặn request dù API vẫn đúng khi test
# bằng Postman/curl.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Đăng ký các router. Router của các chức năng nghiệp vụ sẽ được thêm tiếp
# theo mô hình: app/routers/student/*, app/routers/admin/*.
# ---------------------------------------------------------------------------
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(faculties.router)
app.include_router(student_classes.router)
app.include_router(lecturers.router)
app.include_router(courses.router)
app.include_router(course_sections.router)
app.include_router(academic_terms.router)
app.include_router(users.router)       
app.include_router(import_data.router) 
app.include_router(survey_templates.router)
app.include_router(survey_campaigns.router)
app.include_router(survey_progress.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)