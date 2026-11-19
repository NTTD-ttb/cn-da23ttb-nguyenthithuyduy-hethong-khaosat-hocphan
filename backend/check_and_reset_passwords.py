"""
Script kiểm tra danh sách tài khoản và đồng bộ mật khẩu 123456 cho toàn bộ users.
Chạy từ thư mục backend:
    python check_and_reset_passwords.py
"""

import sys
from pathlib import Path

# Thêm thư mục backend vào sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import StudentProfile
from app.utils.security import hash_password, verify_password

def main():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.user_id.asc()).all()
        if not users:
            print("\n[!] Bảng users hiện đang TRỐNG (chưa có tài khoản nào trong CSDL).")
            print("    Vui lòng chạy script seed_10_records.sql để nạp dữ liệu trước.\n")
            return

        print("\n" + "=" * 90)
        print(f"{'ID':<5} | {'EMAIL':<30} | {'VAI TRÒ':<10} | {'MẬT KHẨU ĐĂNG NHẬP':<22} | {'TRẠNG THÁI'}")
        print("=" * 90)

        updated_count = 0
        new_hash = hash_password("123456")

        for u in users:
            # Kiểm tra xem mật khẩu hiện tại có phải là 123456 không
            is_123456 = False
            try:
                is_123456 = verify_password("123456", u.password_hash)
            except Exception:
                is_123456 = False

            if not is_123456:
                # Cập nhật lại hash chuẩn cho 123456
                u.password_hash = new_hash
                status_text = "ĐÃ ĐỒNG BỘ -> 123456"
                updated_count += 1
            else:
                status_text = "OK (Đúng 123456)"

            print(f"{u.user_id:<5} | {u.email:<30} | {u.role:<10} | {'123456':<22} | {status_text}")

        if updated_count > 0:
            db.commit()
            print("=" * 90)
            print(f"[✓] Đã cập nhật thành công mật khẩu cho {updated_count} tài khoản thành: 123456")
        else:
            print("=" * 90)
            print("[✓] Tất cả tài khoản đều đã có mật khẩu chuẩn: 123456")

        print("=" * 90)
        print("\n=> Bây giờ bạn có thể đăng nhập vào web bằng bất kỳ tài khoản nào ở trên với mật khẩu là: 123456\n")

    except Exception as e:
        db.rollback()
        print(f"\n[X] Lỗi khi kết nối hoặc truy vấn CSDL: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    main()
