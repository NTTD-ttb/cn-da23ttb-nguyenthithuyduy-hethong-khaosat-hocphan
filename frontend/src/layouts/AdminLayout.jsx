import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Users,
  UploadCloud,
  ClipboardCheck,
  TrendingUp,
  BrainCircuit,
  LifeBuoy,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  User as UserIcon,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosClient from '../api/axiosClient';
import logoImg from '../assets/images/Logo_KTCN.png';

// Danh sách các mục điều hướng dành riêng cho Quản trị viên
const navigationItems = [
  {
    label: 'Tổng quan',
    to: '/admin/dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Dữ liệu đào tạo',
    to: '/admin/training-data',
    icon: Database,
  },
  {
    label: 'Quản lý tài khoản',
    to: '/admin/users',
    icon: Users,
  },
  {
    label: 'Nhập dữ liệu Excel',
    to: '/admin/enrollment-import',
    icon: UploadCloud,
  },
  {
    label: 'Đợt khảo sát',
    to: '/admin/campaigns',
    icon: ClipboardCheck,
  },
  {
    label: 'Tiến độ khảo sát',
    to: '/admin/progress',
    icon: TrendingUp,
  },
  {
    label: 'Phân tích kết quả',
    to: '/admin/nlp-analysis',
    icon: BrainCircuit,
    badge: 'AI',
  },
  {
    label: 'Thông báo và Hỗ trợ',
    to: '/admin/support-requests',
    icon: LifeBuoy,
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Danh sách thông báo hệ thống / đợt khảo sát
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Tải thông báo quản trị từ backend
  const fetchNotifications = () => {
    setLoadingNotifs(true);
    axiosClient
      .get('/admin/notifications')
      .then((res) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setNotifications(list);
      })
      .catch((err) => {
        console.error('Chưa tải được thông báo admin:', err);
      })
      .finally(() => {
        setLoadingNotifs(false);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Đóng dropdown khi click bên ngoài
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

  // Số lượng thông báo chưa đọc (nếu có trường is_read)
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Xác định tiêu đề trang hiện tại theo URL
  const currentItem = navigationItems.find((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  );
  const currentPageTitle = currentItem?.label ?? 'Bảng điều khiển Quản trị';

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-800 flex flex-col">
      {/* ============================================================== */}
      {/* 1. HEADER TRÊN CÙNG */}
      {/* ============================================================== */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-sm sm:px-6">
        {/* LOGO & MENU MOBILE BUTTON */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
            className="rounded-lg p-2 text-[#002060] hover:bg-slate-100 lg:hidden transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <NavLink to="/admin/dashboard" className="flex shrink-0 items-center gap-2.5">
            <img
              src={logoImg}
              alt="Logo Trường Đại học Trà Vinh"
              className="h-10 w-10 object-contain drop-shadow-sm"
            />
          </NavLink>

          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-extrabold uppercase tracking-wider text-[#002060]">
                Hệ Thống Quản Trị Khảo Sát
              </p>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Trường Kỹ thuật và Công nghệ — Đại học Trà Vinh
            </p>
          </div>
        </div>

        {/* CỤM NÚT THÔNG BÁO VÀ HỒ SƠ QUẢN TRỊ VIÊN */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ========================================================== */}
          {/* POPUP THÔNG BÁO */}
          {/* ========================================================== */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Thông báo hệ thống"
              title="Thông báo hệ thống"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              className={`relative rounded-xl p-2.5 transition ${
                notifOpen
                  ? 'bg-blue-50 text-[#002060]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#002060]'
              }`}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* HỘP THOẠI POPUP THÔNG BÁO */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Thông báo quản trị
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#002060]">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={fetchNotifications}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Làm mới
                  </button>
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-slate-50">
                  {loadingNotifs ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Đang tải danh sách thông báo...
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
                          className="rounded-xl p-2.5 transition hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 leading-snug">
                              {n.title}
                            </p>
                          </div>
                          {n.content_notification && (
                            <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {n.content_notification}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={11} />
                            <span>{createdAtStr}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Chưa có thông báo hệ thống nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* MENU HỒ SƠ ADMIN DROPDOWN */}
          {/* ========================================================== */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#002060] text-xs font-bold text-white shadow-sm ring-2 ring-blue-100">
                AD
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  Quản Trị Viên
                </span>
                <span className="block text-[10px] text-blue-700 font-medium">
                  {user?.email || 'admin@tvu.edu.vn'}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`hidden text-slate-400 transition-transform duration-200 sm:block ${
                  profileOpen ? 'rotate-180 text-[#002060]' : ''
                }`}
              />
            </button>

            {/* HỘP THOẠI DROPDOWN QUẢN TRỊ VIÊN */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 z-50">
                <div className="border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#002060] text-xs font-bold text-white">
                      AD
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        Quản Trị Viên Hệ Thống
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {user?.email || 'admin@tvu.edu.vn'}
                      </p>
                    </div>
                  </div>
                  
                </div>

                

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 hover:bg-rose-50 transition font-medium text-xs cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất hệ thống</span>
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
          className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* ============================================================== */}
      {/* 2. SIDEBAR BÊN TRÁI - TONE MÀU #002060 SANG TRỌNG */}
      {/* ============================================================== */}
      <aside
        className={`fixed bottom-10 left-0 top-16 z-20 flex w-64 flex-col bg-[#002060] text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TIÊU ĐỀ KHỐI MENU */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/80">
            Danh mục Quản trị
          </p>
        </div>

        {/* DANH SÁCH ĐIỀU HƯỚNG */}
        <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navigationItems.map(({ label, to, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-bold shadow-sm ring-1 ring-white/20 border-l-4 border-amber-400 pl-2.5'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white border-l-4 border-transparent pl-2.5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={17}
                  className="shrink-0 transition-transform group-hover:scale-110"
                />
                <span className="truncate">{label}</span>
              </div>
              {badge && (
                <span className="flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950 shadow-sm">
                  <Sparkles size={10} />
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* NÚT ĐĂNG XUẤT CUỐI SIDEBAR */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 3. NỘI DUNG CHÍNH (MAIN & OUTLET) */}
      {/* ============================================================== */}
      <main className="min-h-[calc(100vh-6.5rem)] pt-16 pb-12 lg:ml-64 flex-1">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          {/* THANH ĐIỀU HƯỚNG BREADCRUMB */}
          <div className="mb-5 flex items-center gap-2 text-[11px] text-slate-500">
            <span>Bảng điều khiển</span>
            <span aria-hidden="true" className="text-slate-300">›</span>
            <span>Quản trị viên</span>
            <span aria-hidden="true" className="text-slate-300">›</span>
            <span className="font-bold text-[#002060]">{currentPageTitle}</span>
          </div>

          {/* NƠI HIỂN THỊ CÁC TRANG CON */}
          <Outlet />
        </div>
      </main>

      {/* ============================================================== */}
      {/* 4. FOOTER CỐ ĐỊNH PHÍA DƯỚI */}
      {/* ============================================================== */}
      <footer className="fixed inset-x-0 bottom-0 z-10 flex min-h-10 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2 text-[10px] text-slate-600 lg:pl-64">
        <span className="font-semibold text-[#002060]">
          © Hệ thống khảo sát sinh viên | Bảng điều khiển Quản trị viên — Trường Kỹ thuật và Công nghệ (Đại học trà vinh)
        </span>
        <div className="hidden items-center gap-3 sm:flex">
          <span>Phiên bản v1.0</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;
