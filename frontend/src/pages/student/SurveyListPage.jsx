import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function SurveyListPage() {
  const navigate = useNavigate();

  // Dữ liệu từ Backend (Không dùng Mockdata)
  const [surveys, setSurveys] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Hôm nay');

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all'); // Mặc định là 'all' (Tất cả học kỳ)
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'not_started' | 'in_progress' | 'completed' | 'expired'

  // Tải dữ liệu thật từ Backend khi mở trang
  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setIsRefreshing(true);
    try {
      const [surveysRes, termsRes] = await Promise.allSettled([
        axiosClient.get('/student/surveys'),
        axiosClient.get('/student/surveys/terms'),
      ]);

      // 1. Nạp danh sách khảo sát từ API
      if (surveysRes.status === 'fulfilled' && surveysRes.value) {
        const rawList = Array.isArray(surveysRes.value)
          ? surveysRes.value
          : Array.isArray(surveysRes.value?.data)
          ? surveysRes.value.data
          : [];

        const mapped = rawList.map((item) => ({
          assignment_id: item.assignment_id,
          section_code: item.section_code || item.course_code,
          course_code: item.course_code || 'HP',
          course_name: item.course_name || 'Học phần',
          credits: item.credits || 3,
          course_type: item.course_type || 'Bắt buộc',
          lecturer_name: item.lecturer_name || 'Chưa phân công',
          lecturer_initials: (item.lecturer_name || 'GV')
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0])
            .join('')
            .toUpperCase(),
          term_name: item.term_name ? `${item.term_name} (${item.academic_year || ''})` : 'Học kỳ hiện tại',
          term_raw: item.term_name || '',
          end_date: item.end_date,
          deadline: item.end_date
            ? new Date(item.end_date).toLocaleDateString('vi-VN')
            : 'Đang mở',
          status: item.status || 'not_started',
          status_label:
            item.status === 'completed'
              ? 'Đã hoàn thành'
              : item.status === 'in_progress'
              ? 'Đang làm'
              : 'Chưa thực hiện',
        }));

        setSurveys(mapped);
      }

      // 2. Nạp danh sách học kỳ từ API
      if (termsRes.status === 'fulfilled' && termsRes.value) {
        const rawTerms = Array.isArray(termsRes.value)
          ? termsRes.value
          : Array.isArray(termsRes.value?.data)
          ? termsRes.value.data
          : [];
        setTerms(rawTerms);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách khảo sát thật:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')} Hôm nay`
      );
    }
  };

  // Tính số lượng cho từng tab
  const tabCounts = useMemo(() => {
    return {
      all: surveys.length,
      not_started: surveys.filter((s) => s.status === 'not_started').length,
      in_progress: surveys.filter((s) => s.status === 'in_progress').length,
      completed: surveys.filter((s) => s.status === 'completed').length,
      expired: surveys.filter((s) => s.status === 'expired').length,
    };
  }, [surveys]);

  // Bộ lọc kết hợp
  const filteredSurveys = useMemo(() => {
    return surveys.filter((item) => {
      // 1. Lọc theo ô tìm kiếm (Tên môn, mã học phần, giảng viên)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.course_name.toLowerCase().includes(q);
        const matchCode =
          item.section_code.toLowerCase().includes(q) ||
          item.course_code.toLowerCase().includes(q);
        const matchLecturer = item.lecturer_name.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLecturer) return false;
      }

      // 2. Lọc theo Học kỳ (Mặc định 'all' là hiển thị tất cả)
      if (selectedTerm && selectedTerm !== 'all') {
        const matchTerm =
          item.term_raw.toLowerCase().includes(selectedTerm.toLowerCase()) ||
          item.term_name.toLowerCase().includes(selectedTerm.toLowerCase());
        if (!matchTerm) return false;
      }

      // 3. Lọc theo dropdown Trạng thái
      if (selectedStatusDropdown !== 'all' && item.status !== selectedStatusDropdown) {
        return false;
      }

      // 4. Lọc theo Tab trên hàng
      if (activeTab !== 'all' && item.status !== activeTab) {
        return false;
      }

      return true;
    });
  }, [surveys, searchTerm, selectedTerm, selectedStatusDropdown, activeTab]);

  // Đặt lại toàn bộ bộ lọc về mặc định
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTerm('all'); // Mặc định về Tất cả học kỳ
    setSelectedStatusDropdown('all');
    setActiveTab('all');
  };

  return (
    <div className="space-y-5 pb-8">
      

      {/* 2. THANH BỘ LỌC TÌM KIẾM & CHỌN HỌC KỲ */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Ô TÌM KIẾM */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên môn học, mã học phần hoặc giảng viên..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* DROPDOWN HỌC KỲ — MẶC ĐỊNH LÀ "TẤT CẢ HỌC KỲ" */}
          <div className="w-full sm:w-64">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Tất cả học kỳ</option>
              {terms.map((t) => (
                <option key={t.term_id} value={t.term_name}>
                  {t.term_name} • Niên khóa {t.academic_year}
                </option>
              ))}
            </select>
          </div>

          {/* DROPDOWN TRẠNG THÁI */}
          <div className="w-full sm:w-52">
            <select
              value={selectedStatusDropdown}
              onChange={(e) => setSelectedStatusDropdown(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="not_started">Chưa thực hiện</option>
              <option value="in_progress">Đang làm</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="expired">Đã hết hạn</option>
            </select>
          </div>

          {/* NÚT ĐẶT LẠI BỘ LỌC */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw size={14} className="text-slate-500" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>

        {/* HÀNG TAB PHÂN LOẠI TRẠNG THÁI (PILL TABS) */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: 'Tất cả', count: tabCounts.all, color: 'bg-slate-100 text-slate-700' },
            { id: 'not_started', label: 'Chưa thực hiện', count: tabCounts.not_started, color: 'bg-slate-100 text-slate-600' },
            { id: 'in_progress', label: 'Đang làm', count: tabCounts.in_progress, color: 'bg-amber-100 text-amber-800' },
            { id: 'completed', label: 'Đã hoàn thành', count: tabCounts.completed, color: 'bg-emerald-100 text-emerald-800' },
            { id: 'expired', label: 'Đã hết hạn', count: tabCounts.expired, color: 'bg-rose-100 text-rose-800' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#08245f] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : tab.color
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH HỌC PHẦN KHẢO SÁT THẬT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Mã LHP</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Tên môn học & Tín chỉ</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Giảng viên phụ trách</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Học kỳ</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Hạn khảo sát</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Trạng thái</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSurveys.map((item) => {
                const isNotStarted = item.status === 'not_started';
                const isInProgress = item.status === 'in_progress';
                const isCompleted = item.status === 'completed';

                return (
                  <tr key={item.assignment_id} className="transition hover:bg-slate-50/80">
                    {/* Mã LHP */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-800">
                        {item.section_code}
                      </span>
                    </td>

                    {/* Tên môn học & Tín chỉ */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{item.course_name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.credits} Tín chỉ • {item.course_type}
                      </p>
                    </td>

                    {/* Giảng viên phụ trách có avatar tròn */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-[10px] text-blue-700">
                          {item.lecturer_initials}
                        </span>
                        <span className="font-medium text-slate-800">{item.lecturer_name}</span>
                      </div>
                    </td>

                    {/* Học kỳ */}
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {item.term_name}
                    </td>

                    {/* Hạn khảo sát */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>Đã nộp bài</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Calendar size={13} className="text-amber-500" />
                            <span>{item.deadline}</span>
                          </div>
                          <span className="block text-[11px] font-semibold text-amber-600">
                            • Đang mở khảo sát
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {isNotStarted && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                          Chưa thực hiện
                        </span>
                      )}

                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-semibold text-amber-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Đang làm dở
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Đã hoàn thành
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {isNotStarted && (
                        <button
                          type="button"
                          onClick={() => navigate(`/student/surveys/${item.assignment_id}`)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#0b3387]"
                        >
                          <span>Bắt đầu</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => navigate(`/student/surveys/${item.assignment_id}`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#08245f] shadow-2xs transition hover:bg-slate-50"
                        >
                          <Edit3 size={13} />
                          <span>Tiếp tục</span>
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => navigate(`/student/surveys/${item.assignment_id}`)}
                          className="text-xs font-semibold text-slate-500 hover:text-[#08245f] transition"
                        >
                          Xem lại phiếu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* TRƯỜNG HỢP KHÔNG CÓ KẾT QUẢ TÌM KIẾM HOẶC CHƯA CÓ MÔN */}
              {filteredSurveys.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      {surveys.length === 0 ? <ClipboardList size={24} /> : <FileQuestion size={24} />}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      {surveys.length === 0
                        ? 'Chưa có học phần nào được phân công khảo sát'
                        : 'Không tìm thấy học phần phù hợp'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                      {surveys.length === 0
                        ? 'Hiện tại hệ thống chưa mở đợt khảo sát nào cho tài khoản sinh viên của bạn. Vui lòng quay lại sau.'
                        : 'Không có lớp học phần nào phù hợp với bộ lọc đã chọn. Hãy thử tìm từ khóa khác hoặc đặt lại bộ lọc.'}
                    </p>
                    {surveys.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                      >
                        <RotateCcw size={13} />
                        <span>Đặt lại bộ lọc</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PHÂN TRANG DƯỚI CÙNG */}
        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div>
            Hiển thị 1 – {filteredSurveys.length} trên tổng số {filteredSurveys.length} môn học
          </div>

          <div className="flex items-center gap-1 self-end sm:self-center">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400 disabled:opacity-50"
            >
              <ChevronLeft size={13} />
              <span>Trước</span>
            </button>
            <button
              type="button"
              className="rounded-lg bg-[#08245f] px-3 py-1 font-bold text-white shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400 disabled:opacity-50"
            >
              <span>Sau</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
