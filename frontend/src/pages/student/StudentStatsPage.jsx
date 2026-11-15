import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  GraduationCap,
  Lock,
  Printer,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

// Danh sách dữ liệu mẫu chuẩn theo thiết kế
const INITIAL_STATS_SURVEYS = [
  {
    assignment_id: 1,
    section_code: '210115_01',
    course_name: 'Mạng máy tính & An toàn TT',
    course_code: 'CNTT214',
    credits: 3,
    lecturer_name: 'TS. Nguyễn Văn Dũng',
    term_name: 'HK II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_at: '10/06/2025 14:30',
    status: 'anonymous_success',
    status_label: 'Đã gửi thành công (Ẩn danh)',
  },
  {
    assignment_id: 2,
    section_code: '210002_03',
    course_name: 'Kiến trúc máy tính',
    course_code: 'CNTT102',
    credits: 2,
    lecturer_name: 'ThS. Lê Hoàng Nam',
    term_name: 'HK II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_at: '08/06/2025 09:15',
    status: 'recorded_locked',
    status_label: 'Đã ghi nhận - Đã khóa',
  },
  {
    assignment_id: 3,
    section_code: '210045_01',
    course_name: 'Trí tuệ nhân tạo căn bản',
    course_code: 'CNTT308',
    credits: 3,
    lecturer_name: 'PGS.TS. Huỳnh Cao Tuấn',
    term_name: 'HK II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_at: '05/06/2025 16:40',
    status: 'anonymous_success',
    status_label: 'Đã gửi thành công (Ẩn danh)',
  },
  {
    assignment_id: 4,
    section_code: '210099_02',
    course_name: 'Kỹ năng nghề nghiệp CNTT',
    course_code: 'CNTT201',
    credits: 2,
    lecturer_name: 'ThS. Trần Thị Bé Bảy',
    term_name: 'HK II (2024 - 2025)',
    term_id: '2024-2025-2',
    submitted_at: '02/06/2025 11:20',
    status: 'recorded_locked',
    status_label: 'Đã ghi nhận - Đã khóa',
  },
  {
    assignment_id: 5,
    section_code: '210020_01',
    course_name: 'Cơ sở dữ liệu nâng cao',
    course_code: 'CNTT210',
    credits: 3,
    lecturer_name: 'TS. Đặng Minh Tuấn',
    term_name: 'HK I (2024 - 2025)',
    term_id: '2024-2025-1',
    submitted_at: '15/01/2025 10:05',
    status: 'recorded_locked',
    status_label: 'Đã ghi nhận - Đã khóa',
  },
  {
    assignment_id: 6,
    section_code: '210018_02',
    course_name: 'Lập trình Java căn bản',
    course_code: 'CNTT118',
    credits: 3,
    lecturer_name: 'ThS. Nguyễn Thái Sơn',
    term_name: 'HK I (2024 - 2025)',
    term_id: '2024-2025-1',
    submitted_at: '12/01/2025 15:45',
    status: 'recorded_locked',
    status_label: 'Đã ghi nhận - Đã khóa',
  },
];

export default function StudentStatsPage() {
  const [surveys, setSurveys] = useState(INITIAL_STATS_SURVEYS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('2024-2025-2');
  const [selectedTime, setSelectedTime] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Quản lý modal xem chi tiết và in phiếu
  const [viewModalItem, setViewModalItem] = useState(null);
  const [printModalItem, setPrintModalItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Tải dữ liệu thật từ API nếu backend đã có
  useEffect(() => {
    axiosClient
      .get('/student/stats/summary')
      .then((res) => {
        if (res.data) {
          // Có thể cập nhật thêm số liệu tổng hợp nếu backend trả về
        }
      })
      .catch(() => {
        // Giữ mock chuẩn
      });
  }, []);

  // Lọc dữ liệu theo các tiêu chí
  const filteredSurveys = useMemo(() => {
    return surveys.filter((item) => {
      // 1. Tìm theo từ khóa
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.course_name.toLowerCase().includes(q);
        const matchSection = item.section_code.toLowerCase().includes(q);
        const matchCode = item.course_code.toLowerCase().includes(q);
        const matchLecturer = item.lecturer_name.toLowerCase().includes(q);
        if (!matchName && !matchSection && !matchCode && !matchLecturer) return false;
      }

      // 2. Lọc theo Học kỳ
      if (selectedTerm !== 'all' && item.term_id !== selectedTerm) {
        return false;
      }

      // 3. Lọc theo Trạng thái
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [surveys, searchTerm, selectedTerm, selectedStatus]);

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTerm('2024-2025-2');
    setSelectedTime('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. HÀNG 4 THẺ THỐNG KÊ (KPI CARDS) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* THẺ 1: Tổng số phiếu đã nộp */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng số phiếu đã nộp</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">12 phiếu</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <CheckCircle2 size={13} />
            <span>Qua 3 học kỳ tích lũy</span>
          </div>
        </div>

        {/* THẺ 2: Học kỳ hiện tại */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Học kỳ hiện tại (HK II 2024 - 2025)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SlidersHorizontal size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              4 / 6 <span className="text-lg font-semibold text-slate-500">môn</span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Còn 2 môn đang mở khảo sát</span>
          </div>
        </div>

        {/* THẺ 3: Tỷ lệ tham gia trung bình */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tỷ lệ tham gia trung bình</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">100%</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <span>↗ Đạt chuẩn trách nhiệm học vụ</span>
          </div>
        </div>

        {/* THẺ 4: Tình trạng ghi nhận */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tình trạng ghi nhận</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm font-bold text-slate-900">Đã đồng bộ TVU Portal</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <Lock size={12} />
            <span>Hợp lệ để xem điểm học phần</span>
          </div>
        </div>
      </div>

      {/* 2. THANH BỘ LỌC TÌM KIẾM CHI TIẾT */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* CỘT 1: TỪ KHÓA TÌM KIẾM */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Từ khóa tìm kiếm
            </label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên môn học, mã lớp học phần, tên giảng viên..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* CỘT 2: HỌC KỲ */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">Học kỳ</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="2024-2025-2">HK II (2024 - 2025)</option>
              <option value="2024-2025-1">HK I (2024 - 2025)</option>
              <option value="all">Tất cả học kỳ</option>
            </select>
          </div>

          {/* CỘT 3: THỜI GIAN NỘP */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Thời gian nộp
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="30_days">30 ngày qua</option>
              <option value="this_term">Học kỳ này</option>
            </select>
          </div>

          {/* CỘT 4: TRẠNG THÁI GHI NHẬN */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Trạng thái ghi nhận
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="anonymous_success">Đã gửi thành công (Ẩn danh)</option>
              <option value="recorded_locked">Đã ghi nhận - Đã khóa</option>
            </select>
          </div>
        </div>

        {/* HÀNG DƯỚI BỘ LỌC: ĐẾM KẾT QUẢ & NÚT THAO TÁC */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Tìm thấy{' '}
            <strong className="text-slate-800">{filteredSurveys.length} phiếu khảo sát</strong>{' '}
            phù hợp bộ lọc hiện tại
          </p>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw size={13} className="text-slate-500" />
              <span>Đặt lại bộ lọc</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#0b3387]"
            >
              <Filter size={13} />
              <span>Áp dụng lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH LỊCH SỬ KHẢO SÁT */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Mã LHP</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Tên môn học & Số TC</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Giảng viên giảng dạy</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Học kỳ</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Ngày & Giờ nộp</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-center">Trạng thái</th>
                <th className="px-5 py-3.5 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSurveys.map((item) => (
                <tr key={item.assignment_id} className="transition hover:bg-slate-50/80">
                  {/* Mã LHP */}
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] font-bold text-slate-800">
                    {item.section_code}
                  </td>

                  {/* Tên môn học & Số TC */}
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{item.course_name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      • {item.credits} Tín chỉ • Mã học phần: {item.course_code}
                    </p>
                  </td>

                  {/* Giảng viên */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} className="text-slate-400" />
                      <span className="font-medium text-slate-800">{item.lecturer_name}</span>
                    </div>
                  </td>

                  {/* Học kỳ */}
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      {item.term_name}
                    </span>
                  </td>

                  {/* Ngày & Giờ nộp */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      <span>{item.submitted_at}</span>
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-[11px] font-medium text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {item.status_label}
                    </span>
                  </td>

                  {/* Thao tác (2 nút icon: Xem & In) */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewModalItem(item)}
                        title="Xem chi tiết phiếu đã gửi"
                        aria-label="Xem chi tiết phiếu đã gửi"
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs transition hover:border-slate-300 hover:text-[#08245f] hover:bg-slate-50"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintModalItem(item)}
                        title="Tải / In phiếu xác nhận khảo sát"
                        aria-label="Tải / In phiếu xác nhận khảo sát"
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs transition hover:border-slate-300 hover:text-[#08245f] hover:bg-slate-50"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSurveys.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Không tìm thấy phiếu khảo sát nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PHÂN TRANG DƯỚI CÙNG */}
        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div>
            Hiển thị 1 – {filteredSurveys.length} trên tổng số 12 phiếu khảo sát đã gửi
          </div>

          <div className="flex items-center gap-1 self-end sm:self-center">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400 disabled:opacity-50"
            >
              <ChevronLeft size={13} />
              <span>Trước</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`rounded-lg px-3 py-1 font-bold ${
                currentPage === 1
                  ? 'bg-[#08245f] text-white shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`rounded-lg px-3 py-1 font-bold ${
                currentPage === 2
                  ? 'bg-[#08245f] text-white shadow-2xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <span>Sau</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: XEM CHI TIẾT PHIẾU KHẢO SÁT */}
      {/* ============================================================== */}
      {viewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Chi tiết phiếu khảo sát ẩn danh</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="font-bold text-slate-800 text-sm">{viewModalItem.course_name}</p>
                <p className="text-slate-500">Mã LHP: {viewModalItem.section_code} • {viewModalItem.credits} Tín chỉ</p>
                <p className="text-slate-500">Giảng viên: {viewModalItem.lecturer_name}</p>
                <p className="text-slate-500">Thời gian nộp: {viewModalItem.submitted_at}</p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-[11px] text-emerald-800">
                ✅ Phiếu khảo sát này đã được mã hóa an toàn và ghi nhận hợp lệ lên cổng thông tin sinh viên TVU.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewModalItem(null)}
                className="rounded-xl bg-[#08245f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b3387]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: XÁC NHẬN IN PHIẾU KHẢO SÁT */}
      {/* ============================================================== */}
      {printModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#08245f]">
              <Printer size={22} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xuất giấy xác nhận hoàn thành
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                In chứng nhận đã hoàn thành khảo sát môn học{' '}
                <strong className="text-slate-800">{printModalItem.course_name}</strong> để nộp phòng Đào tạo khi có yêu cầu.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrintModalItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setPrintModalItem(null);
                }}
                className="rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white hover:bg-[#0b3387]"
              >
                In phiếu ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
