import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  Eye,
  FileText,
  Info,
  Layers,
  Lock,
  MessageSquare,
  ShieldCheck,
  User,
  Bell,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../api/axiosClient';

const GUIDE_DOCUMENT_URL =
  'https://docs.google.com/document/d/1vKvC9C6VXi0r0yC5fMYmZ28qcIwhqphZ/edit?usp=drive_link&ouid=116555884419031655025&rtpof=true&sd=true';

const getGoogleDrivePreviewUrl = (url) => {
  if (!url) return '';

  const documentMatch = url.match(/docs\.google\.com\/document\/d\/([^/?]+)/);
  if (documentMatch) {
    return `https://docs.google.com/document/d/${documentMatch[1]}/preview`;
  }

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  return url;
};

export default function StudentHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const guidePreviewUrl = getGoogleDrivePreviewUrl(GUIDE_DOCUMENT_URL);

  // 1. Thông tin sinh viên đăng nhập
  const [studentInfo, setStudentInfo] = useState({
    full_name: 'Sinh viên',
    student_code: '',
  });

  // 2. Danh sách học kỳ từ CSDL & Học kỳ đang chọn
  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState('');

  // 3. Danh sách khảo sát & Thông báo từ CSDL
  const [allSurveys, setAllSurveys] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc tab ở bảng khảo sát gần đây
  const [recentTab, setRecentTab] = useState('all'); // 'all' | 'completed' | 'expired'

  // Tải dữ liệu thật từ Backend
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, surveysRes, termsRes, notifsRes] = await Promise.allSettled([
        axiosClient.get('/student/profile'),
        axiosClient.get('/student/surveys'),
        axiosClient.get('/student/surveys/terms'),
        axiosClient.get('/student/notifications?limit=5'),
      ]);

      // Hồ sơ sinh viên
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const p = profileRes.value?.data !== undefined ? profileRes.value.data : profileRes.value;
        if (p && (p.full_name || p.student_code)) {
          setStudentInfo({
            full_name: p.full_name || 'Sinh viên',
            student_code: p.student_code || '',
          });
        }
      }

      // Danh sách học kỳ từ CSDL
      let termList = [];
      if (termsRes.status === 'fulfilled' && termsRes.value) {
        termList = Array.isArray(termsRes.value)
          ? termsRes.value
          : Array.isArray(termsRes.value?.data)
          ? termsRes.value.data
          : [];
        setTerms(termList);

        // Thuật toán xác định học kỳ mặc định dựa theo thời gian thực tế hiện tại
        const now = new Date();
        let defaultTerm = termList.find((t) => {
          if (!t.start_date || !t.end_date) return false;
          const start = new Date(t.start_date);
          const end = new Date(t.end_date);
          end.setHours(23, 59, 59, 999);
          return now >= start && now <= end;
        });

        // Nếu ngày hiện tại không rơi đúng khoảng nào, chọn học kỳ mới nhất
        if (!defaultTerm && termList.length > 0) {
          defaultTerm = termList[0];
        }

        if (defaultTerm) {
          setSelectedTermId(String(defaultTerm.term_id));
        }
      }

      // Danh sách môn khảo sát
      if (surveysRes.status === 'fulfilled' && surveysRes.value) {
        const list = Array.isArray(surveysRes.value)
          ? surveysRes.value
          : Array.isArray(surveysRes.value?.data)
          ? surveysRes.value.data
          : [];
        setAllSurveys(list);
      }

      // Danh sách thông báo
      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        const notifList = Array.isArray(notifsRes.value)
          ? notifsRes.value
          : Array.isArray(notifsRes.value?.data)
          ? notifsRes.value.data
          : [];
        setNotifications(notifList);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu trang chủ:', err);
    } finally {
      setLoading(false);
    }
  };

  // Học kỳ đang chọn hiện tại
  const currentSelectedTerm = useMemo(() => {
    return terms.find((t) => String(t.term_id) === String(selectedTermId)) || terms[0] || null;
  }, [terms, selectedTermId]);

  // Phân loại môn chưa xong và môn đã hoàn thành
  const pendingSurveys = useMemo(() => {
    return allSurveys.filter((s) => s.status !== 'completed');
  }, [allSurveys]);

  const recentSurveys = useMemo(() => {
    return allSurveys.filter((s) => s.status === 'completed');
  }, [allSurveys]);

  // Thống kê số liệu thật
  const stats = useMemo(() => {
    const total = allSurveys.length;
    const completed = recentSurveys.length;
    const open = pendingSurveys.length;
    const rate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    return {
      total,
      completed,
      open,
      rate,
      urgent: open > 0 ? 1 : 0,
    };
  }, [allSurveys, recentSurveys, pendingSurveys]);

  // Lọc bảng theo tab
  const filteredRecentSurveys = useMemo(() => {
    if (recentTab === 'completed') return recentSurveys;
    if (recentTab === 'expired') return allSurveys.filter((s) => s.status === 'expired');
    return recentSurveys;
  }, [recentTab, recentSurveys, allSurveys]);

  // Format ngày tháng hiển thị
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Gần đây';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. LỜI CHÀO & COMBOBOX CHỌN HỌC KỲ DỰA THEO THỜI GIAN THỰC */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Xin chào, {studentInfo.full_name}{' '}
            <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Chào mừng bạn quay trở lại. Hãy dành chút thời gian đánh giá các học phần để nâng cao chất lượng giảng dạy và hoàn tất quyền lợi sinh viên.
          </p>
        </div>

        {/* COMBOBOX TẤT CẢ CÁC HỌC KỲ TỰ ĐỘNG CHỌN THEO THỜI GIAN HIỆN TẠI */}
        <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-bold text-[#08245f] outline-none"
          >
            {terms.length > 0 ? (
              terms.map((t) => (
                <option key={t.term_id} value={t.term_id} className="text-slate-800 bg-white">
                  {t.term_name} • Niên khóa {t.academic_year}
                </option>
              ))
            ) : (
              <option value="default" className="text-slate-800 bg-white">
                Học kỳ II • Niên khóa 2024 - 2025
              </option>
            )}
          </select>
        </div>
      </div>

      {/* 2. HÀNG 3 THẺ THỐNG KÊ (KPI CARDS - DỮ LIỆU THẬT TỪ CSDL) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* THẺ 1: Khảo sát đang mở */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Khảo sát đang mở</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.open}</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-rose-500">
            <AlertCircle size={14} />
            <span>
              {stats.open > 0
                ? '! Cần xử lý • Học phần cần đánh giá'
                : '✓ Bạn đã hoàn thành tất cả phiếu'}
            </span>
          </div>
        </div>

        {/* THẺ 2: Khảo sát đã hoàn thành */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Khảo sát đã hoàn thành</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.completed}{' '}
              <span className="text-xl font-medium text-slate-400">/ {stats.total}</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-600">Đạt {stats.rate}% tiến độ</span>
              <span className="text-slate-500">{stats.completed} môn hoàn tất</span>
            </div>
          </div>
        </div>

        {/* THẺ 3: Khảo sát sắp đến hạn */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Khảo sát sắp đến hạn</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.urgent}</span>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Hạn chót học kỳ</span>
              <span className="text-amber-600 font-semibold">• Theo dõi tiến độ</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. KHẢO SÁT CẦN THỰC HIỆN NGAY */}
      {/* <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#08245f]" />
            <h2 className="text-base font-bold text-slate-900">
              Khảo sát cần thực hiện ({pendingSurveys.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Ưu tiên hoàn thành trước hạn chót</span>
        </div>

        {pendingSurveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pendingSurveys.map((survey) => {
              const isDraft = survey.status === 'in_progress';

              return (
                <div
                  key={survey.assignment_id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div>
                   
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold tracking-wider text-slate-400">
                        MÃ HP: {survey.course_code}
                      </span>
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Đang làm
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          Chưa thực hiện
                        </span>
                      )}
                    </div>

                    
                    <h3 className="mt-2 text-base font-bold text-slate-900">
                      {survey.course_name}
                    </h3>

                  
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-slate-400" />
                        <span>
                          Mã lớp HP:{' '}
                          <strong className="text-slate-700">{survey.section_code}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span>
                          Giảng viên: <strong className="text-slate-700">{survey.lecturer_name}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Học kỳ: {survey.term_name || currentSelectedTerm?.term_name || 'Học kỳ hiện tại'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-rose-500 font-medium">
                        <Clock size={14} />
                        <span>
                          Hạn hoàn thành: {survey.end_date ? formatDate(survey.end_date) : 'Đang mở'}
                        </span>
                      </div>
                    </div>
                  </div>

              
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <ShieldCheck size={15} />
                      Khảo sát ẩn danh 100%
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate(`/student/surveys/${survey.assignment_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#0b3387]"
                    >
                      <span>{isDraft ? 'Tiếp tục khảo sát' : 'Thực hiện khảo sát'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
            <p className="mt-2 text-sm font-bold text-slate-800">
              Tuyệt vời! Bạn không còn khảo sát nào cần thực hiện
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tất cả các phiếu khảo sát được giao đã được hoàn thành đầy đủ.
            </p>
          </div>
        )}
      </div> */}

      {/* ============================================================== */}
      {/* 5. PHẦN MỚI: THÔNG BÁO MỚI & HƯỚNG DẪN KHẢO SÁT */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* CỘT TRÁI (7 PHẦN): THÔNG BÁO MỚI TỪ NHÀ TRƯỜNG */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-7">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#08245f]">
                  <Bell size={16} />
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Thông báo mới từ Nhà trường
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {notifications.length} thông báo
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.notification_id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {notif.title}
                      </h3>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={11} />
                        {formatDate(notif.created_notification)}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.content_notification}
                    </p>

                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/student/support')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-[#08245f] hover:underline"
                      >
                        <span>Xem chi tiết</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Hiện tại không có thông báo mới nào từ nhà trường.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 PHẦN): CẨM NANG & HƯỚNG DẪN KHẢO SÁT */}
        <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-5 shadow-xs lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#08245f] text-white">
                <Compass size={16} />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Hướng dẫn & Quy định Khảo sát
              </h2>
            </div>

            <div className="mt-3.5 space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Khảo sát ý kiến sinh viên là hoạt động thường niên nhằm nâng cao chất lượng giảng dạy và dịch vụ đào tạo tại <strong>Đại học Trà Vinh</strong>.
              </p>

              <div className="space-y-2 rounded-xl bg-white/80 p-3.5 border border-blue-100/70">
                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-[#08245f]">
                    1
                  </span>
                  <p className="text-[11px] leading-snug">
                    <strong>Đánh giá trung thực:</strong> Đánh giá khách quan theo trải nghiệm học tập thực tế của bạn.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    2
                  </span>
                  <p className="text-[11px] leading-snug">
                    <strong>Bảo mật danh tính 100%:</strong> Giảng viên chỉ xem được điểm tổng hợp, hoàn toàn không biết người đánh giá.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                    3
                  </span>
                  <p className="text-[11px] leading-snug">
                    <strong>Quyền lợi sinh viên:</strong> Hoàn thành phiếu khảo sát là điều kiện để hệ thống tự động mở điểm thi học phần.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-100">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#08245f] py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0b3387] transition"
            >
              <span>Xem hướng dẫn chi tiết</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. KHẢO SÁT GẦN ĐÂY (BẢNG DANH SÁCH MÔN HỌC ĐÃ HOÀN THÀNH) */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#08245f]" />
            <h2 className="text-base font-bold text-slate-900">Khảo sát gần đây</h2>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setRecentTab('all')}
              className={`rounded-lg px-3 py-1 transition ${
                recentTab === 'all'
                  ? 'bg-white text-[#08245f] shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setRecentTab('completed')}
              className={`rounded-lg px-3 py-1 transition ${
                recentTab === 'completed'
                  ? 'bg-white text-[#08245f] shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Đã hoàn thành ({recentSurveys.length})
            </button>
            <button
              type="button"
              onClick={() => setRecentTab('expired')}
              className={`rounded-lg px-3 py-1 transition ${
                recentTab === 'expired'
                  ? 'bg-white text-[#08245f] shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Đã hết hạn (0)
            </button>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Mã HP</th>
                <th className="px-5 py-3.5">Tên môn học</th>
                <th className="px-5 py-3.5">Giảng viên</th>
                <th className="px-5 py-3.5">Thời gian hoàn thành</th>
                <th className="px-5 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecentSurveys.map((item) => (
                <tr key={item.assignment_id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{item.course_code}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{item.course_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{item.lecturer_name}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {item.end_date ? formatDate(item.end_date) : 'Đã nộp thành công'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Đã hoàn thành
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/student/surveys/${item.assignment_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:text-[#08245f]"
                    >
                      <Eye size={13} />
                      <span>Xem lại phiếu</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecentSurveys.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không có khảo sát nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. HỘP ĐIỀU KIỆN MỞ ĐIỂM TỔNG KẾT HỌC PHẦN */}
      {/* <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 sm:text-sm">
              Điều kiện mở điểm tổng kết học phần
            </h4>
            <p className="text-[11px] text-slate-600 sm:text-xs">
              Khi đã hoàn thành đầy đủ các phiếu khảo sát được giao, toàn bộ điểm tổng kết học phần sẽ tự động mở khóa.
            </p>
          </div>
        </div>

        <div className="self-end sm:self-center">
          <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
            {stats.completed}/{stats.total} Hoàn tất
          </span>
        </div>
      </div> */}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-guide-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowGuideModal(false);
          }}
        >
          <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 id="student-guide-title" className="text-sm font-bold text-slate-900 sm:text-base">
                    Hướng dẫn thực hiện khảo sát học phần
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Tài liệu hướng dẫn dành cho sinh viên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng hướng dẫn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-2 sm:p-3">
              {guidePreviewUrl ? (
                <iframe
                  title="Tài liệu hướng dẫn khảo sát"
                  src={guidePreviewUrl}
                  className="h-full w-full rounded-xl border border-slate-200 bg-white"
                  allow="fullscreen"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Chưa có liên kết tài liệu hướng dẫn.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Nội dung được tải trực tiếp từ Google Drive
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="ml-auto rounded-xl bg-[#08245f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3387]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
