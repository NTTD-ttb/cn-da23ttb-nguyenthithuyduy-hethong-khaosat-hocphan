import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Info,
  Layers,
  Lock,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../api/axiosClient';

// Dữ liệu mẫu chuẩn giao diện (dùng khi API chưa có dữ liệu hoặc đang tải)
const DEFAULT_PENDING_SURVEYS = [
  {
    assignment_id: 1,
    course_code: '210103',
    course_name: 'Lập trình Web nâng cao',
    section_code: '210103_01',
    credits: 3,
    lecturer_name: 'ThS. Trương Minh Tuyên',
    term_name: 'Học kỳ II (2024 - 2025)',
    deadline: '15/06/2025 (Còn 5 ngày)',
    status: 'not_started',
    status_label: 'Chưa thực hiện',
    progress_percent: 0,
    answered_count: 0,
    total_questions: 15,
  },
  {
    assignment_id: 2,
    course_code: '210108',
    course_name: 'Cơ sở dữ liệu phân tán',
    section_code: '210108_02',
    credits: 3,
    lecturer_name: 'TS. Phạm Thị Kim Chi',
    term_name: 'Học kỳ II (2024 - 2025)',
    deadline: '15/06/2025 (Còn 5 ngày)',
    status: 'in_progress',
    status_label: 'Đang làm (40%)',
    progress_percent: 40,
    answered_count: 6,
    total_questions: 15,
  },
];

const DEFAULT_RECENT_SURVEYS = [
  {
    assignment_id: 3,
    course_code: '210115',
    course_name: 'Mạng máy tính & An toàn TT',
    lecturer_name: 'TS. Nguyễn Văn Dũng',
    submitted_at: '10/06/2025 14:30',
    status: 'completed',
  },
  {
    assignment_id: 4,
    course_code: '210002',
    course_name: 'Kiến trúc máy tính',
    lecturer_name: 'ThS. Lê Hoàng Nam',
    submitted_at: '08/06/2025 09:15',
    status: 'completed',
  },
  {
    assignment_id: 5,
    course_code: '210045',
    course_name: 'Trí tuệ nhân tạo căn bản',
    lecturer_name: 'PGS.TS. Huỳnh Cao Tuấn',
    submitted_at: '05/06/2025 16:40',
    status: 'completed',
  },
  {
    assignment_id: 6,
    course_code: '210099',
    course_name: 'Kỹ năng nghề nghiệp CNTT',
    lecturer_name: 'ThS. Trần Thị Bé Bảy',
    submitted_at: '02/06/2025 11:20',
    status: 'completed',
  },
];

export default function StudentHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentInfo, setStudentInfo] = useState({
    full_name: user?.full_name || 'Nguyễn Minh Anh',
    student_code: user?.student_code || '110121045',
  });

  const [recentTab, setRecentTab] = useState('all'); // 'all' | 'completed' | 'expired'
  const [pendingSurveys, setPendingSurveys] = useState(DEFAULT_PENDING_SURVEYS);
  const [recentSurveys, setRecentSurveys] = useState(DEFAULT_RECENT_SURVEYS);
  const [stats, setStats] = useState({
    openCount: 2,
    completedCount: 4,
    totalCount: 6,
    completionRate: 66.7,
    urgentCount: 1,
  });

  // Tải dữ liệu thật từ API nếu có
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, surveysRes] = await Promise.allSettled([
          axiosClient.get('/student/profile'),
          axiosClient.get('/student/surveys'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          setStudentInfo((prev) => ({
            ...prev,
            full_name: profileRes.value.data.full_name || prev.full_name,
            student_code: profileRes.value.data.student_code || prev.student_code,
          }));
        }

        if (surveysRes.status === 'fulfilled' && Array.isArray(surveysRes.value?.data) && surveysRes.value.data.length > 0) {
          const allSurveys = surveysRes.value.data;
          const pending = allSurveys.filter((s) => s.status !== 'completed');
          const completed = allSurveys.filter((s) => s.status === 'completed');

          if (pending.length > 0) setPendingSurveys(pending);
          if (completed.length > 0) setRecentSurveys(completed);

          const total = allSurveys.length;
          const done = completed.length;
          setStats({
            openCount: pending.length,
            completedCount: done,
            totalCount: total,
            completionRate: total > 0 ? Math.round((done / total) * 1000) / 10 : 0,
            urgentCount: pending.filter((s) => s.is_urgent).length || 1,
          });
        }
      } catch {
        // Giữ dữ liệu mặc định chuẩn mẫu giao diện nếu API chưa sẵn sàng
      }
    };

    fetchData();
  }, []);

  // Lọc bảng theo tab
  const filteredRecentSurveys = recentSurveys.filter((item) => {
    if (recentTab === 'completed') return item.status === 'completed';
    if (recentTab === 'expired') return item.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* 1. LỜI CHÀO & THÔNG TIN HỌC KỲ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Xin chào, {studentInfo.full_name} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Chào mừng bạn quay trở lại. Hãy dành chút thời gian đánh giá các học phần để nâng cao chất lượng giảng dạy và hoàn tất quyền lợi sinh viên.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-blue-100 bg-blue-50/70 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Học kỳ II • Niên khóa 2024 - 2025</span>
        </div>
      </div>

      {/* 2. HÀNG 3 THẺ THỐNG KÊ (KPI CARDS) */}
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
            <span className="text-3xl font-extrabold text-slate-900">{stats.openCount}</span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-rose-500">
            <AlertCircle size={14} />
            <span>! Cần xử lý • Học phần cần đánh giá</span>
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
              {stats.completedCount} <span className="text-xl font-medium text-slate-400">/ {stats.totalCount}</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-600">Đạt {stats.completionRate}% tiến độ</span>
              <span className="text-slate-500">{stats.completedCount} môn hoàn tất</span>
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
            <span className="text-3xl font-extrabold text-slate-900">{stats.urgentCount}</span>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Hạn chót 15/06/2025</span>
              <span className="text-amber-600 font-semibold">• Còn 3 ngày tới</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. KHỐI THÔNG BÁO BẢO MẬT & ẨN DANH */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-3 text-xs text-slate-700">
        <MessageSquare size={18} className="shrink-0 text-[#08245f]" />
        <span>
          <strong>Chú ý:</strong> Khảo sát được thực hiện hoàn toàn ẩn danh (Anonymous). Điểm thi học phần chỉ được mở khi sinh viên hoàn thành khảo sát.
        </span>
      </div>

      {/* 4. KHẢO SÁT CẦN THỰC HIỆN NGAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#08245f]" />
            <h2 className="text-base font-bold text-slate-900">
              Khảo sát cần thực hiện ({pendingSurveys.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Ưu tiên hoàn thành trước hạn chót</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pendingSurveys.map((survey) => {
            const isDraft = survey.status === 'in_progress';

            return (
              <div
                key={survey.assignment_id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md"
              >
                <div>
                  {/* Mã học phần + Badge trạng thái */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400">
                      MÃ HP: {survey.course_code}
                    </span>
                    {isDraft ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Đang làm ({survey.progress_percent}%)
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                        {survey.status_label || 'Chưa thực hiện'}
                      </span>
                    )}
                  </div>

                  {/* Tên môn học */}
                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {survey.course_name}
                  </h3>

                  {/* Chi tiết học phần */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-slate-400" />
                      <span>
                        Mã lớp HP: <strong className="text-slate-700">{survey.section_code}</strong> ({survey.credits || 3} Tín chỉ)
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
                      <span>Học kỳ: {survey.term_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-500 font-medium">
                      <Clock size={14} />
                      <span>Hạn hoàn thành: {survey.deadline}</span>
                    </div>
                  </div>

                  {/* Tiến độ lưu nháp nếu đang làm dở */}
                  {isDraft && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Tiến độ lưu nháp</span>
                        <span className="font-semibold text-slate-700">
                          {survey.answered_count} / {survey.total_questions} câu hỏi đã trả lời
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#08245f]"
                          style={{ width: `${survey.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hàng hành động dưới cùng */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  {isDraft ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Edit3 size={14} className="text-slate-400" />
                      Đã lưu bản nháp tự động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <ShieldCheck size={15} />
                      Khảo sát ẩn danh 100%
                    </span>
                  )}

                  {isDraft ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/student/surveys/${survey.assignment_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#08245f] shadow-2xs transition hover:bg-slate-50"
                    >
                      <span>Tiếp tục khảo sát</span>
                      <Edit3 size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/student/surveys/${survey.assignment_id}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#0b3387]"
                    >
                      <span>Thực hiện khảo sát</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. KHẢO SÁT GẦN ĐÂY (BẢNG DANH SÁCH MÔN HỌC) */}
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
                <th className="px-5 py-3.5">Thời gian gửi</th>
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
                  <td className="px-5 py-3.5 text-slate-500">{item.submitted_at}</td>
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

      {/* 6. HỘP ĐIỀU KIỆN MỞ ĐIỂM TỔNG KẾT HỌC PHẦN */}
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 sm:text-sm">
              Điều kiện mở điểm tổng kết học phần
            </h4>
            <p className="text-[11px] text-slate-600 sm:text-xs">
              Khi đã hoàn thành đầy đủ 6/6 phiếu khảo sát, toàn bộ điểm tổng kết học phần sẽ tự động mở khóa.
            </p>
          </div>
        </div>

        <div className="self-end sm:self-center">
          <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
            4/6 Hoàn tất
          </span>
        </div>
      </div>
    </div>
  );
}
