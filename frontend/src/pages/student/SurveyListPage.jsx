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
  SlidersHorizontal,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

// Danh sách dữ liệu mẫu chuẩn theo thiết kế
const INITIAL_SURVEYS = [
  {
    assignment_id: 1,
    section_code: '210103_01',
    course_code: '210103',
    course_name: 'Lập trình Web nâng cao',
    credits: 3,
    course_type: 'Bắt buộc',
    lecturer_name: 'ThS. Trương Minh Tuyên',
    lecturer_initials: 'TT',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    deadline: '15/06/2025',
    remaining_days: 'Còn 5 ngày kết thúc',
    status: 'not_started', // not_started | in_progress | completed | expired
    status_label: 'Chưa thực hiện',
    progress_percent: 0,
    answered_count: 0,
    total_questions: 15,
  },
  {
    assignment_id: 2,
    section_code: '210108_02',
    course_code: '210108',
    course_name: 'Cơ sở dữ liệu phân tán',
    credits: 3,
    course_type: 'Chuyên ngành',
    lecturer_name: 'TS. Phạm Thị Kim Chi',
    lecturer_initials: 'KC',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    deadline: '15/06/2025',
    remaining_days: 'Còn 5 ngày kết thúc',
    status: 'in_progress',
    status_label: 'Đang làm (40%)',
    progress_percent: 40,
    answered_count: 6,
    total_questions: 15,
  },
  {
    assignment_id: 3,
    section_code: '210115_01',
    course_code: '210115',
    course_name: 'Mạng máy tính & An toàn TT',
    credits: 3,
    course_type: 'Bắt buộc',
    lecturer_name: 'TS. Nguyễn Văn Dũng',
    lecturer_initials: 'VD',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_date: 'Xong 10/06/2025',
    status: 'completed',
    status_label: 'Đã hoàn thành',
  },
  {
    assignment_id: 4,
    section_code: '210002_03',
    course_code: '210002',
    course_name: 'Kiến trúc máy tính',
    credits: 2,
    course_type: 'Cơ sở ngành',
    lecturer_name: 'ThS. Lê Hoàng Nam',
    lecturer_initials: 'HN',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_date: 'Xong 08/06/2025',
    status: 'completed',
    status_label: 'Đã hoàn thành',
  },
  {
    assignment_id: 5,
    section_code: '210045_01',
    course_code: '210045',
    course_name: 'Trí tuệ nhân tạo căn bản',
    credits: 3,
    course_type: 'Chuyên ngành',
    lecturer_name: 'PGS.TS. Huỳnh Cao Tuấn',
    lecturer_initials: 'CT',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_date: 'Xong 05/06/2025',
    status: 'completed',
    status_label: 'Đã hoàn thành',
  },
  {
    assignment_id: 6,
    section_code: '210099_02',
    course_code: '210099',
    course_name: 'Kỹ năng nghề nghiệp CNTT',
    credits: 2,
    course_type: 'Bổ trợ kỹ năng',
    lecturer_name: 'ThS. Trần Thị Bé Bảy',
    lecturer_initials: 'BB',
    term_name: 'Học kỳ II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_date: 'Xong 02/06/2025',
    status: 'completed',
    status_label: 'Đã hoàn thành',
  },
];

export default function SurveyListPage() {
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState(INITIAL_SURVEYS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('2024-2025-2');
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'not_started' | 'in_progress' | 'completed' | 'expired'
  const [mockEmpty, setMockEmpty] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('08:30 Hôm nay');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tải dữ liệu thật từ API nếu backend đã có
  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setIsRefreshing(true);
    try {
      const res = await axiosClient.get('/student/surveys');
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Chuẩn hóa dữ liệu API với cấu trúc hiển thị
        const mapped = res.data.map((item, idx) => ({
          assignment_id: item.assignment_id || idx + 1,
          section_code: item.section_code || item.course_code,
          course_code: item.course_code || 'HP',
          course_name: item.course_name || 'Học phần',
          credits: item.credits || 3,
          course_type: item.course_type || 'Bắt buộc',
          lecturer_name: item.lecturer_name || 'Chưa phân công',
          lecturer_initials: (item.lecturer_name || 'GV')
            .split(' ')
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0])
            .join('')
            .toUpperCase(),
          term_name: item.term_name || 'Học kỳ II (2024 - 2025)',
          term_id: '2024-2025-2',
          deadline: item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : '15/06/2025',
          remaining_days: 'Còn 5 ngày kết thúc',
          status: item.status || 'not_started',
          status_label:
            item.status === 'completed'
              ? 'Đã hoàn thành'
              : item.status === 'in_progress'
              ? 'Đang làm (40%)'
              : 'Chưa thực hiện',
          progress_percent: item.status === 'in_progress' ? 40 : 0,
          answered_count: item.status === 'in_progress' ? 6 : 0,
          total_questions: 15,
        }));
        setSurveys(mapped);
      }
    } catch {
      // Giữ mock chuẩn thiết kế nếu chưa có API
    } finally {
      setIsRefreshing(false);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} Hôm nay`);
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

  // Bộ lọc dữ liệu kết hợp
  const filteredSurveys = useMemo(() => {
    if (mockEmpty) return [];

    return surveys.filter((item) => {
      // 1. Lọc theo ô tìm kiếm (Tên môn, mã học phần, giảng viên)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.course_name.toLowerCase().includes(q);
        const matchCode = item.section_code.toLowerCase().includes(q) || item.course_code.toLowerCase().includes(q);
        const matchLecturer = item.lecturer_name.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchLecturer) return false;
      }

      // 2. Lọc theo Học kỳ
      if (selectedTerm && selectedTerm !== 'all' && item.term_id !== selectedTerm) {
        return false;
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
  }, [surveys, searchTerm, selectedTerm, selectedStatusDropdown, activeTab, mockEmpty]);

  // Reset bộ lọc về mặc định
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTerm('2024-2025-2');
    setSelectedStatusDropdown('all');
    setActiveTab('all');
    setMockEmpty(false);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TIÊU ĐỀ & MÔ TẢ TRANG */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Khảo sát của tôi
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi và thực hiện khảo sát cho các lớp học phần bạn đã đăng ký trong học kỳ.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start text-xs text-slate-500 sm:self-center">
          <span>Cập nhật lúc: {lastUpdated}</span>
          <button
            type="button"
            onClick={fetchSurveys}
            disabled={isRefreshing}
            aria-label="Làm mới dữ liệu"
            title="Làm mới dữ liệu"
            className="rounded-md p-1.5 hover:bg-slate-200/70 text-slate-600 transition"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

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

          {/* DROPDOWN HỌC KỲ */}
          <div className="w-full sm:w-60">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="2024-2025-2">Học kỳ II (2024 - 2025)</option>
              <option value="2024-2025-1">Học kỳ I (2024 - 2025)</option>
              <option value="all">Tất cả học kỳ</option>
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

      {/* 3. BẢNG DANH SÁCH HỌC PHẦN KHẢO SÁT */}
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
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <CheckCircle2 size={13} className="text-emerald-500" />
                          <span>{item.submitted_date}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Calendar size={13} className="text-amber-500" />
                            <span>{item.deadline}</span>
                          </div>
                          <span className="block text-[11px] font-semibold text-amber-600">
                            • {item.remaining_days}
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
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-[11px] font-semibold text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Đang làm (40%)
                          </span>
                          <span className="block mt-0.5 text-[10px] text-slate-400">
                            Đã trả lời: 6/15 câu
                          </span>
                        </div>
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
                          Xem chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* TRƯỜNG HỢP KHÔNG CÓ KẾT QUẢ */}
              {filteredSurveys.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FileQuestion size={24} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Không tìm thấy môn học nào
                    </p>
                    <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                      Không có lớp học phần nào phù hợp với bộ lọc hiện tại. Hãy thử tìm từ khóa khác hoặc đặt lại bộ lọc.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
                    >
                      <RotateCcw size={13} />
                      <span>Đặt lại bộ lọc</span>
                    </button>
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

      {/* 5. KHỐI MÔ PHỎNG TEST TRẠNG THÁI GIAO DIỆN */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <span>
            <strong>Mô phỏng trạng thái giao diện:</strong> Kiểm tra hiển thị khi tìm kiếm không có kết quả hoặc khi tải dữ liệu.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMockEmpty((prev) => !prev)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-slate-100"
        >
          {mockEmpty ? 'Khôi phục danh sách' : 'Bật/Tắt Mock Trống'}
        </button>
      </div>
    </div>
  );
}
