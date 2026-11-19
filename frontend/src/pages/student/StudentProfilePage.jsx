import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  GraduationCap,
  Key,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState({
    full_name: '',
    student_code: '',
    class_code: '',
    class_name: '',
    faculty_name: '',
    date_of_birth: null,
    gender_student: '',
    email: '',
    phone_student: '',
    avatar_url: '',
    address_student: '',
  });

  const [initialPhone, setInitialPhone] = useState('');
  const [phone, setPhone] = useState('');

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/student/profile')
      .then((response) => {
        const data = response?.data || response;
        if (!data || !data.student_id) {
          throw new Error('Dữ liệu hồ sơ trả về không hợp lệ.');
        }
        if (!active) return;

        setProfile(data);
        setPhone(data.phone_student || '');
        setInitialPhone(data.phone_student || '');
        setProfileError('');
      })
      .catch((error) => {
        if (active) {
          setProfileError(
            error.response?.data?.detail || error.message || 'Không thể tải hồ sơ sinh viên.'
          );
        }
      })
      .finally(() => {
        if (active) setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Kiểm tra quy định mật khẩu mạnh
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndNumber = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const hasSpecialChar = /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const notSameAsStudentCode =
    newPassword.length > 0 &&
    (!profile.student_code ||
      !newPassword.toLowerCase().includes(profile.student_code.toLowerCase())) &&
    (!profile.full_name ||
      !newPassword.toLowerCase().includes(profile.full_name.toLowerCase().replace(/\s+/g, '')));

  // Lưu thông tin liên hệ (SĐT)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await axiosClient.put('/student/profile', {
        phone_student: phone,
      });
      const updatedProfile = response?.data || response;
      if (updatedProfile?.student_id) setProfile(updatedProfile);
      const savedPhone = updatedProfile?.phone_student ?? phone;
      setPhone(savedPhone || '');
      setInitialPhone(savedPhone || '');
      showToast('✅ Cập nhật số điện thoại liên hệ thành công!');
    } catch (error) {
      showToast(
        error.response?.data?.detail || error.message || 'Không thể cập nhật số điện thoại.',
        true
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('❌ Vui lòng nhập mật khẩu hiện tại!', true);
      return;
    }
    if (!hasMinLength) {
      showToast('❌ Mật khẩu mới phải có tối thiểu 8 ký tự!', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('❌ Mật khẩu xác nhận không khớp!', true);
      return;
    }

    setChangingPassword(true);
    try {
      await axiosClient.patch('/student/change-password', {
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      showToast('🎉 Đổi mật khẩu tài khoản thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Lỗi đổi mật khẩu, vui lòng kiểm tra lại!';
      showToast(`❌ ${msg}`, true);
    } finally {
      setChangingPassword(false);
    }
  };

  const showToast = (message, isError = false) => {
    setToastMessage({ message, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (isRefreshing) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Đang tải hồ sơ sinh viên...
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-600" size={28} />
        <p className="mt-3 text-sm font-semibold text-rose-800">
          Không thể tải hồ sơ sinh viên
        </p>
        <p className="mt-1 text-xs text-rose-700">{profileError}</p>
        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            setReloadKey((key) => key + 1);
          }}
          className="mt-4 rounded-xl bg-[#08245f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b3387]"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* THÔNG BÁO TOAST NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg animate-bounce ${
            toastMessage.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      
      {/* 2. THẺ PROFILE BANNER (THÔNG TIN TỔNG QUAN) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        {/* THANH HEADER NAVY */}
        <div className="flex items-center justify-between bg-[#08245f] px-6 py-2.5 text-[11px] font-semibold tracking-wider text-blue-200 uppercase">
          <span>THÔNG TIN SINH VIÊN</span>
          
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* THÔNG TIN SINH VIÊN + AVATAR */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* AVATAR CÓ NÚT CAMERA */}
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-100 text-2xl font-bold text-[#08245f] shadow-inner">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`Ảnh đại diện ${profile.full_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.full_name
                      .split(' ')
                      .filter(Boolean)
                      .slice(-2)
                      .map((word) => word[0])
                      .join('')
                  )}
                </div>
                <button
                  type="button"
                  title="Thay đổi ảnh đại diện"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#08245f] text-white shadow-sm transition hover:bg-[#0b3387]"
                >
                  <Camera size={13} />
                </button>
              </div>

              {/* TÊN, MSSV, KHOA & CỐ VẤN */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{profile.full_name}</h2>
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#08245f]">
                    {profile.class_code || profile.class_name || 'Chưa cập nhật lớp'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                    MSSV: {profile.student_code}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  <strong>{profile.faculty_name || 'Chưa cập nhật khoa'}</strong>
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 size={13} />
                    Hồ sơ từ hệ thống
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <GraduationCap size={14} className="text-slate-400" />
                    Lớp: <strong>{profile.class_name || profile.class_code || 'Chưa cập nhật'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BỐ CỤC 2 CỘT: THÔNG TIN CHI TIẾT & ĐỔI MẬT KHẨU */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI (7 PHẦN): THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs lg:col-span-7 flex flex-col justify-between">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* HEADER KHỐI TRÁI */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#08245f]">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thông tin cá nhân & Liên hệ</h3>
                  <p className="text-[11px] text-slate-400">
                    Dữ liệu liên hệ và thông tin cá nhân của sinh viên
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                <Lock size={12} />
                Được xác thực TVU
              </span>
            </div>

            {/* CÁC TRƯỜNG DỮ LIỆU */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
              {/* Họ và tên (Khóa) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Họ và tên *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.full_name}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-700 cursor-not-allowed"
                  />
                  <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* MSSV (Khóa) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Mã số sinh viên (MSSV) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.student_code}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-700 cursor-not-allowed"
                  />
                  <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Ngày sinh (Khóa) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Ngày sinh</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(profile.date_of_birth)}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-700 cursor-not-allowed"
                  />
                  <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Giới tính (Khóa) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Giới tính</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.gender_student || ''}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-700 cursor-not-allowed"
                  />
                  <User size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Lớp sinh hoạt (Khóa) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Lớp sinh hoạt</label>
                <input
                  type="text"
                  value={profile.class_name || profile.class_code || ''}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-3.5 text-xs font-medium text-slate-700 cursor-not-allowed"
                />
              </div>

            </div>

            {/* Email trường cấp (Full width - Khóa) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Email trường cấp (Dùng nhận thông báo khảo sát)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-700 cursor-not-allowed"
                />
                <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Số điện thoại di động (Được phép sửa) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Số điện thoại di động (Liên hệ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại liên hệ..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <Edit2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* NÚT THAO TÁC CỘT TRÁI */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhone(initialPhone)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0b3387] transition"
              >
                <Save size={13} />
                <span>{savingProfile ? 'Đang lưu...' : 'Lưu cập nhật thông tin'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI (5 PHẦN): BẢO MẬT & ĐỔI MẬT KHẨU */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs lg:col-span-5 flex flex-col justify-between">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* HEADER KHỐI PHẢI */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bảo mật & Đổi mật khẩu</h3>
                  <p className="text-[11px] text-slate-400">
                    Cập nhật định kỳ để bảo vệ tài khoản
                  </p>
                </div>
              </div>

              <ShieldCheck size={18} className="text-emerald-500" />
            </div>

            {/* TRƯỜNG 1: MẬT KHẨU HIỆN TẠI */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Mật khẩu hiện tại *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* TRƯỜNG 2: MẬT KHẨU MỚI */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* TRƯỜNG 3: XÁC NHẬN MẬT KHẨU MỚI */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* KHỐI QUY ĐỊNH MẬT KHẨU MẠNH */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
              <span className="block text-[11px] font-semibold text-slate-700">
                Quy định mật khẩu mạnh:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Tối thiểu 8 ký tự</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasUpperAndNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${hasUpperAndNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Có chữ hoa và số (A-Z, 0-9)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${hasSpecialChar ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Ký tự đặc biệt (@, #, $...)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    notSameAsStudentCode ? 'text-emerald-600 font-medium' : 'text-slate-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${notSameAsStudentCode ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Không trùng MSSV hoặc tên</span>
                </div>
              </div>
            </div>

            {/* THÔNG TIN LẦN ĐỔI CUỐI */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Đổi mật khẩu được xác thực bởi hệ thống
              </span>
            </div>

            {/* NÚT THAO TÁC CỘT PHẢI */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-[#08245f] transition"
              >
                Quên mật khẩu?
              </button>
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0b3387] transition"
              >
                <Key size={13} />
                <span>{changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
