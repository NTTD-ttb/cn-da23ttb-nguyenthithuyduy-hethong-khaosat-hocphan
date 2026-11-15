import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpenCheck,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/images/logo_KTCN.png';

const navigationItems = [
  { label: 'Tổng quan', to: '/student/home', icon: LayoutDashboard, end: true },
  { label: 'Danh sách khảo sát', to: '/student/surveys', icon: ClipboardList },
  { label: 'Lịch sử khảo sát', to: '/student/stats', icon: History },
  { label: 'Gửi hỗ trợ', to: '/student/support', icon: FileText },
  // { label: 'Hướng dẫn & Quy định', to: '/student/support', icon: CircleHelp },
  { label: 'Cài đặt tài khoản', to: '/student/profile', icon: Settings },
];

const StudentLayout = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage =
    navigationItems.find((item) =>
      item.end
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to),
    )?.label ?? 'Hệ thống khảo sát sinh viên';

  return (
    <div className="min-h-screen bg-[#f6f8ff] text-slate-800">
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
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
            <span className="hidden text-lg font-extrabold tracking-tight text-[#08245f] sm:inline">
              TVU<span className="text-lime-500">.</span>
            </span>
          </NavLink>
          <div className="hidden min-w-0 border-l border-slate-200 pl-3 sm:block">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-[#08245f]">
              Hệ thống khảo sát sinh viên
            </p>
            <p className="text-[11px] text-slate-500">Đại học Trà Vinh</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <label className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:flex">
            <BookOpenCheck size={14} className="text-[#08245f]" />
            <span className="sr-only">Học kỳ</span>
            <select
              defaultValue="2024-2025-2"
              className="max-w-40 cursor-pointer bg-transparent outline-none"
            >
              <option value="2024-2025-2">Học kỳ II (2024 - 2025)</option>
              <option value="2024-2025-1">Học kỳ I (2024 - 2025)</option>
            </select>
          </label>
          <button
            type="button"
            aria-label="Thông báo"
            title="Thông báo"
            className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-[#08245f]"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          <NavLink
            to="/student/profile"
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6edff] text-xs font-bold text-[#08245f]">
              SV
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-slate-800">Sinh viên</span>
              <span className="block text-[10px] text-slate-500">Tài khoản sinh viên</span>
            </span>
            <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </NavLink>
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed bottom-10 left-0 top-16 z-20 flex w-60 flex-col bg-[#08245f] text-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lime-300">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">ĐẠI HỌC TRÀ VINH</p>
            <p className="truncate text-[10px] text-blue-200">Hệ thống khảo sát sinh viên</p>
          </div>
        </div>

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

      <footer className="fixed inset-x-0 bottom-0 z-10 flex min-h-10 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2 text-[10px] text-slate-600 lg:pl-64">
        <span className="font-medium text-[#08245f]">
          © Hệ thống khảo sát sinh viên | Trường Đại học Trà Vinh (TVU)
        </span>
        <div className="hidden items-center gap-3 sm:flex">
          <span>Hỗ trợ kỹ thuật: ctsv@tvu.edu.vn</span>
          <span aria-hidden="true">•</span>
          <span>(0294) 3855 246</span>
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