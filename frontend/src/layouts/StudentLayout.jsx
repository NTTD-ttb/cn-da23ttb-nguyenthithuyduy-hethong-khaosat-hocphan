import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ClipboardList,
  FileText,
  History,
  Home,
  Key,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import logoImg from '../assets/images/logo_KTCN.png';

const navigationItems = [
  { label: 'Trang chủ', to: '/student/home', icon: Home, end: true },
  { label: 'Danh sách khảo sát', to: '/student/surveys', icon: ClipboardList },
  { label: 'Lịch sử khảo sát', to: '/student/stats', icon: History },
  { label: 'Gửi hỗ trợ', to: '/student/support', icon: FileText },
  { label: 'Cài đặt tài khoản', to: '/student/profile', icon: Settings },
];

const StudentLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Dữ liệu từ Backend
  const [studentInfo, setStudentInfo] = useState({
    full_name: 'Sinh viên',
    student_code: '',
    email: '',
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // 1. Lấy thông tin hồ sơ sinh viên từ backend
  // Lưu ý: axiosClient đã tự động unwrap response.data, nên res chính là data
  useEffect(() => {
    axiosClient
      .get('/student/profile')
      .then((res) => {
        const data = res?.data !== undefined ? res.data : res;
        if (data && (data.full_name || data.student_code)) {
          setStudentInfo(data);
        }
      })
      .catch((err) => {
        console.error('Chưa tải được hồ sơ sinh viên từ backend:', err);
      });
  }, []);

  // 2. Lấy danh sách thông báo từ CSDL
  const fetchNotifications = () => {
    setLoadingNotifs(true);
    axiosClient
      .get('/student/notifications')
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setNotifications(list);
      })
      .catch((err) => {
        console.error('Chưa tải được thông báo từ backend:', err);
      })
      .finally(() => {
        setLoadingNotifs(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đánh dấu thông báo đã đọc
  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosClient.patch(`/student/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  // Tính số thông báo chưa đọc
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Lấy chữ viết tắt tên sinh viên làm avatar
  const getInitials = (name) => {
    if (!name || name === 'Sinh viên') return 'SV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const currentPage =
    navigationItems.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to)
    )?.label ?? 'Hệ thống khảo sát sinh viên';

  return (
    <div className="min-h-screen bg-[#f6f8ff] text-slate-800">
      {/* HEADER TRÊN CÙNG */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        {/* LOGO & MENU MOBILE */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded-md p-2 text-[#08245f] hover:bg-slate-100 lg:hidden"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <NavLink to="/student/home" className="flex shrink-0 items-center gap-2">
            <img src={logoImg} alt="Logo Trường Đại học Trà Vinh" className="h-9 w-9 object-contain" />
          </NavLink>
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-[#08245f]">
              Hệ thống khảo sát sinh viên
            </p>
            <p className="text-[11px] text-slate-500">Trường Kỹ thuật và Công nghệ - Đại học Trà Vinh</p>
          </div>
        </div>

        {/* NÚT THÔNG BÁO VÀ HỒ SƠ SINH VIÊN */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ============================================================== */}
          {/* 1. CHUÔNG THÔNG BÁO (POPUP DANH SÁCH THÔNG BÁO) */}
          {/* ============================================================== */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Thông báo"
              title="Thông báo"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className={`relative rounded-lg p-2 transition ${
                notifOpen
                  ? 'bg-blue-50 text-[#08245f]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#08245f]'
              }`}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* HỘP THOẠI POPUP THÔNG BÁO */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#08245f]">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchNotifications}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Làm mới
                  </button>
                </div>

                {/* DANH SÁCH CÁC THÔNG BÁO TRONG CSDL */}
                <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
                  {loadingNotifs ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => {
                      const createdAtStr = n.created_notification
                        ? new Date(n.created_notification).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Vừa xong';

                      return (
                        <div
                          key={n.notification_id}
                          onClick={() => handleMarkAsRead(n.notification_id)}
                          className={`rounded-xl p-2.5 transition cursor-pointer ${
                            n.is_read
                              ? 'hover:bg-slate-50 opacity-80'
                              : 'bg-blue-50/50 hover:bg-blue-50/80 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 mt-1" />
                            )}
                          </div>
                          {n.content_notification && (
                            <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {n.content_notification}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={11} />
                            <span>Ngày tạo: {createdAtStr}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Hiện tại bạn không có thông báo nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 2. MENU TÀI KHOẢN SINH VIÊN (CLICK HIỆN HỘP THOẠI DROPDOWN) */}
          {/* ============================================================== */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6edff] text-xs font-bold text-[#08245f]">
                {getInitials(studentInfo.full_name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-slate-800">
                  {studentInfo.full_name || 'Sinh viên'}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {studentInfo.student_code ? `MSSV: ${studentInfo.student_code}` : 'Tài khoản sinh viên'}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                  profileOpen ? 'rotate-180 text-[#08245f]' : ''
                }`}
              />
            </button>

            {/* HỘP THOẠI DROPDOWN HỒ SƠ */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 z-50">
                {/* Header trong popup */}
                <div className="border-b border-slate-100 p-3">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {studentInfo.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {studentInfo.email || (studentInfo.student_code ? `MSSV: ${studentInfo.student_code}` : 'Sinh viên TVU')}
                  </p>
                </div>

                {/* Các lựa chọn hành động */}
                <div className="py-1 text-xs">
                  {/* Mục 1: Thông tin cá nhân */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/student/profile');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#08245f] transition font-medium"
                  >
                    <User size={15} className="text-slate-400" />
                    <span>Thông tin cá nhân</span>
                  </button>

                  {/* Mục 2: Đổi mật khẩu */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/student/profile');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#08245f] transition font-medium"
                  >
                    <Key size={15} className="text-slate-400" />
                    <span>Đổi mật khẩu</span>
                  </button>
                </div>

                {/* Mục 3: Đăng xuất */}
                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 transition font-medium text-xs"
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY KHI MỞ MENU MOBILE */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* SIDEBAR BÊN TRÁI (#08245f) */}
      <aside
        className={`fixed bottom-10 left-0 top-16 z-20 flex w-60 flex-col bg-[#08245f] text-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav aria-label="Điều hướng sinh viên" className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navigationItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'border-lime-400 bg-white/10 text-white'
                    : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 border-t border-white/10 px-5 py-3.5 text-xs font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </aside>

      {/* NỘI DUNG CHÍNH (OUTLET) */}
      <main className="min-h-[calc(100vh-6.5rem)] pt-16 pb-10 lg:ml-60">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-500">
            <span>Trang chủ</span>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-[#08245f]">{currentPage}</span>
          </div>
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="fixed inset-x-0 bottom-0 z-10 flex min-h-10 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2 text-[10px] text-slate-600 lg:pl-64">
        <span className="font-medium text-[#08245f]">
          © Hệ thống khảo sát sinh viên | Trường Kỹ thuật và Công nghệ - Đại học Trà Vinh
        </span>
        <div className="hidden items-center gap-3 sm:flex">
          <span>Hỗ trợ kỹ thuật: ktcn@tvu.edu.vn</span>
          <span aria-hidden="true">•</span>
          <span>(0299) 9999 248</span>
          <span aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={12} />
            Chính sách bảo mật
          </span>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
