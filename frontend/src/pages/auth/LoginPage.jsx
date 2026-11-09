import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import loginBanner from '../../assets/images/Bentraidn.png'; 
import logoImg from '../../assets/images/logo_KTCN.png';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  HelpCircle, 
  ShieldCheck, 
  AlertCircle,
  GraduationCap,
  Mail,
  Phone
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      // Chỉ cho phép sinh viên vào từ cổng này
      if (res.role === 'student') {
        navigate('/student/home');
      } else {
        setError('Tài khoản này thuộc quyền Quản trị viên. Vui lòng đăng nhập tại Cổng Quản Trị!');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8faff] text-slate-700">
      
      {/* 1. HEADER */}
      <header className="w-full bg-white border-b border-slate-100 py-3.5 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
         {/* Logo đại diện */}
        <div className="h-11 w-11 rounded-full border border-slate-100 p-0.5 shadow-xs flex items-center justify-center bg-white shrink-0 overflow-hidden">
        <img 
            src={logoImg} 
            alt="Logo Trường Kỹ thuật và Công nghệ - TVU" 
            className="h-full w-full object-contain"
        />
        </div>
          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-tight leading-snug">
              TRƯỜNG KỸ THUẬT VÀ CÔNG NGHỆ - ĐẠI HỌC TRÀ VINH
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Hệ thống khảo sát sinh viên trực tuyến
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-full text-emerald-600 text-[11px] font-medium hidden sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hệ thống hoạt động</span>
          </div>
          <button 
            type="button"
            onClick={() => alert("Vui lòng liên hệ Phòng Đào tạo / CTSV hoặc hotline bên dưới để được hỗ trợ!")}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#002060] font-medium transition cursor-pointer"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">Hỗ trợ sinh viên</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT (LOGIN CARD) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Cột trái: Ảnh minh họa 550x700 px */}
        <div className="md:w-1/2 relative bg-slate-100 min-h-[260px] md:min-h-[520px] overflow-hidden flex items-center justify-center">
        <img 
            src={loginBanner} 
            alt="Banner Khảo sát sinh viên TVU" 
            className="w-full h-full object-cover object-center transition duration-500 hover:scale-105"
        />
        {/* Lớp phủ gradient nhẹ giúp ảnh hòa nhập sang trọng với khung trắng (tùy chọn) */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none md:hidden"></div>
        </div>

          {/* Cột phải: Form đăng nhập */}
          <div className="md:w-1/2 p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Tiêu đề Form */}
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Vui lòng nhập tài khoản để tham gia khảo sát học phần và theo dõi đánh giá.
              </p>

              {/* Tab/Badge Vai trò */}
              <div className="mt-5">
                <div className="w-full py-2 px-3 rounded-lg bg-[#002060] text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-xs">
                  <GraduationCap size={16} />
                  <span>Sinh viên</span>
                </div>
              </div>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Input Email / MSSV */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email sinh viên hoặc MSSV
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email sinh viên hoặc MSSV"
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-xs text-slate-800 outline-none transition focus:border-[#002060] focus:ring-1 focus:ring-[#002060]"
                    />
                  </div>
                </div>

                {/* Input Mật khẩu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert("Vui lòng liên hệ Admin qua email ctsv@tvu.edu.vn để được cấp lại mật khẩu.")}
                      className="text-[11px] text-slate-500 hover:text-[#002060] transition cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-xs text-slate-800 outline-none transition focus:border-[#002060] focus:ring-1 focus:ring-[#002060]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Ghi nhớ đăng nhập */}
                <div className="flex items-center pt-1">
                  <input
                    id="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#002060] focus:ring-[#002060] cursor-pointer"
                  />
                  <label htmlFor="remember_me" className="ml-2 block text-xs text-slate-600 cursor-pointer select-none">
                    Ghi nhớ đăng nhập trên thiết bị này
                  </label>
                </div>

                {/* Nút Đăng nhập với mã màu #002060 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#002060] hover:bg-[#001848] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-950/20 transition active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
                </button>
              </form>

              {/* Ghi chú bảo mật */}
              <div className="mt-5 text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-slate-400" />
                  <span>Sử dụng tài khoản sinh viên do nhà trường cấp.</span>
                </p>
              </div>
            </div>

            {/* Footer nhỏ của Card */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Phiên bản v2.4.0</span>
            </div>
          </div>

        </div>
      </main>

      {/* 3. FOOTER DƯỚI CÙNG CỦA TRANG */}
      <footer className="w-full bg-white border-t border-slate-100 py-3.5 px-4 sm:px-8 text-[11px] text-slate-500 flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div>
          © Hệ thống khảo sát sinh viên | Trường kỹ thuật và công nghệ - Đại học trà vinh (Designed By: Nguyen Thi Thuy Duy)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <span className="flex items-center gap-1 hover:text-slate-700">
            <Mail size={13} className="text-slate-400" /> Hỗ trợ kỹ thuật: ktcn@tvu.edu.vn
          </span>
          <span className="flex items-center gap-1 hover:text-slate-700">
            <Phone size={13} className="text-slate-400" /> (0123) 0456 789
          </span>
          <a href="#privacy" className="hover:text-[#002060] transition">
            Chính sách bảo mật
          </a>
        </div>
      </footer>

    </div>
  );
};

export default LoginPage;