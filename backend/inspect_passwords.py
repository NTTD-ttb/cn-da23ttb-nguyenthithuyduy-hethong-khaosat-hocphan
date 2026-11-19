"""
Script kiểm tra mật khẩu hiện tại trong CSDL là gì
Chạy trên CMD:
    cd d:\TTCN\Hethongkhaosat\backend
    python inspect_passwords.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.database import SessionLocal
from app.models.user import User
from app.utils.security import verify_password, hash_password

# Danh sách các mật khẩu phổ biến thường được đặt trong đồ án
CANDIDATES = [
    "123456",
    "12345678",
    "admin",
    "admin123",
    "Admin@123",
    "Admin123",
    "password",
    "Password@123",
    "110123081",
    "110121045",
    "tvu",
    "tvu123",
    "TVU@123",
    "da23ttb",
    "DA23TTB",
    "student",
    "student123",
    "123",
    "1234",
    "12345",
    "ThuyDuy",
    "thuyduy",
    "root",
]

def main():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.user_id.asc()).all()
        if not users:
            print("\n[!] Bảng users hiện đang TRỐNG (chưa có tài khoản nào trong CSDL).")
            return

        print("\n" + "=" * 80)
        print("DANH SÁCH TÀI KHOẢN VÀ DÒ TÌM MẬT KHẨU HIỆN TẠI TRONG CSDL")
        print("=" * 80)

        unmatched_users = []

        for u in users:
            found_pw = None
            for cand in CANDIDATES:
                try:
                    if verify_password(cand, u.password_hash):
                        found_pw = cand
                        break
                except Exception:
                    pass

            if found_pw:
                print(f"[✓] Email: {u.email:<30} | Role: {u.role:<8} => MẬT KHẨU LÀ: '{found_pw}'")
            else:
                print(f"[?] Email: {u.email:<30} | Role: {u.role:<8} => Chuỗi băm lạ, không khớp mật khẩu phổ biến!")
                unmatched_users.append(u)

        print("=" * 80)

        # Nếu có tài khoản có chuỗi băm lạ không khớp
        if unmatched_users:
            print(f"\n[!] Có {len(unmatched_users)} tài khoản đang có chuỗi mã băm không hợp lệ nên không thể gõ đăng nhập.")
            ans = input("Bạn có muốn đặt lại mật khẩu cho tất cả tài khoản thành '123456' không? (y/n): ")
            if ans.strip().lower() in ['y', 'yes', 'c', 'co']:
                new_hash = hash_password("123456")
                for u in users:
                    u.password_hash = new_hash
                db.commit()
                print("[✓] ĐÃ ĐẶT LẠI THÀNH CÔNG: Mọi tài khoản giờ đây đều đăng nhập bằng mật khẩu '123456'!\n")
            else:
                print("Đã giữ nguyên dữ liệu.\n")
        else:
            print("\n[✓] Tất cả tài khoản đều đã xác định được mật khẩu!\n")

    except Exception as e:
        db.rollback()
        print(f"\n[X] Lỗi: {e}\n")
    finally:
        db.close()

if __name__ == "__main__":
    main()
