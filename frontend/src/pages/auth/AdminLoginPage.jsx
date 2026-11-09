import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle,
  ArrowLeft,
  Server
} from 'lucide-react';
import logoImg from '../../assets/images/logo_KTCN.png'; 

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Tài khoản của bạn không có quyền Quản trị viên!');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 text-slate-100">
      
      {/* HEADER QUẢN TRỊ */}
      <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
            <img src={logoImg} alt="TVU Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              CỔNG QUẢN TRỊ HỆ THỐNG KHẢO SÁT
            </h1>
            <p className="text-[10px] text-slate-400">Trường Kỹ thuật và Công nghệ - ĐH Trà Vinh</p>
          </div>
        </div>

        <Link 
          to="/login"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Về trang sinh viên</span>
        </Link>
      </header>

      {/* CARD ĐĂNG NHẬP ADMIN */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/80">
          
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002060] text-blue-400 border border-blue-900/50 mb-3 shadow-lg shadow-blue-950">
              <Server size={28} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Quản Trị Viên Đăng Nhập
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Khu vực dành riêng cho Ban quản lý & Cán bộ khảo sát
            </p>
          </div>

          {/* Báo lỗi */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-950/50 p-3 text-xs text-red-400 border border-red-800/60">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Quản trị viên
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tvu.edu.vn"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mật khẩu quản trị
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 py-2.5 pl-10 pr-10 text-xs text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#002060] hover:bg-blue-900 text-white text-xs font-bold flex items-center justify-center gap-2 border border-blue-800 transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <LogIn size={16} />
              <span>{isSubmitting ? 'Đang xác thực bảo mật...' : 'Đăng nhập Quản Trị'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldAlert size={13} className="text-amber-500" />
              <span>Mọi hoạt động truy cập đều được ghi nhật ký hệ thống (Audit Log).</span>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-3 px-6 text-center text-[11px] text-slate-500 border-t border-slate-800/60">
        Hệ thống khảo sát sinh viên | Trường Kỹ thuật và công nghệ - Đại học Trà Vinh
      </footer>

    </div>
  );
};

export default AdminLoginPage;