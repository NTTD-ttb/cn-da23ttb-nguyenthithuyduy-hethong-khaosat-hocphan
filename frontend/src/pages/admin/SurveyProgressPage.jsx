import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Building2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Send,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Flame,
  Trophy,
  Radio,
  Eye,
  X,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function SurveyProgressPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [overview, setOverview] = useState(null);
  const [facultyProgress, setFacultyProgress] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // State bộ lọc và tìm kiếm danh sách lượt phân công
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'in_progress' | 'not_started'
  const [searchStudent, setSearchStudent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // State Modal Gửi thông báo nhắc nhở làm bài
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderData, setReminderData] = useState({
    title: 'Nhắc nhở hoàn thành khảo sát ý kiến sinh viên',
    content:
      'Chỉ còn ít ngày nữa sẽ kết thúc đợt khảo sát đánh giá giảng viên. Sinh viên vui lòng hoàn thành 100% phiếu khảo sát để tự động mở khóa điểm học phần trên TVU Portal.',
    target: 'not_started', // 'not_started' | 'all'
  });
  const [sendingReminder, setSendingReminder] = useState(false);

  // State Modal Xem chi tiết lượt khảo sát
  const [detailModal, setDetailModal] = useState({
    open: false,
    item: null,
  });

  // Tự ẩn Toast sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 1. Tải danh sách các đợt khảo sát
  useEffect(() => {
    axiosClient
      .get('/admin/survey-campaigns/?limit=50')
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setCampaigns(list);
        if (list.length > 0) {
          // Ưu tiên chọn đợt 'open' hoặc đợt đầu tiên
          const openCamp = list.find((c) => c.status === 'open') || list[0];
          setSelectedCampaignId(String(openCamp.campaign_id));
        }
      })
      .catch((err) => {
        console.error('Lỗi tải đợt khảo sát:', err);
      });
  }, []);

  // 2. Tải thống kê tổng quan và tiến độ theo khoa khi đổi đợt khảo sát
  const fetchDashboardData = async (campaignId) => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [overviewRes, progressRes] = await Promise.all([
        axiosClient.get(`/admin/dashboard/overview?campaign_id=${campaignId}`),
        axiosClient.get(`/admin/dashboard/survey-progress?campaign_id=${campaignId}`),
      ]);

      const ov = overviewRes?.data !== undefined ? overviewRes.data : overviewRes;
      const prog = progressRes?.data !== undefined ? progressRes.data : progressRes;

      setOverview(ov);
      setFacultyProgress(prog?.by_faculties || []);
    } catch (err) {
      console.error('Lỗi tải số liệu tiến độ:', err);
      setToast({
        type: 'error',
        message: 'Không thể tải số liệu thống kê tiến độ.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Tải danh sách chi tiết các lượt làm bài (Survey Assignments)
  const fetchAssignments = async (campaignId) => {
    if (!campaignId) return;
    setLoadingList(true);
    try {
      const res = await axiosClient.get(
        `/admin/survey-progress/?limit=300&campaign_id=${campaignId}`
      );
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setAssignments(list);
    } catch (err) {
      console.error('Lỗi tải danh sách lượt làm bài:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) {
      fetchDashboardData(selectedCampaignId);
      fetchAssignments(selectedCampaignId);
      setCurrentPage(1);
    }
  }, [selectedCampaignId]);

  // Thông tin đợt khảo sát đang chọn
  const currentCampaign = useMemo(() => {
    return campaigns.find((c) => String(c.campaign_id) === String(selectedCampaignId));
  }, [campaigns, selectedCampaignId]);

  // Lọc danh sách lượt làm bài
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (searchStudent.trim()) {
        const kw = searchStudent.toLowerCase().trim();
        const code = item.student_code?.toLowerCase() || '';
        const name = item.student_name?.toLowerCase() || '';
        const sec = item.section_code?.toLowerCase() || '';
        const course = item.course_name?.toLowerCase() || '';
        return code.includes(kw) || name.includes(kw) || sec.includes(kw) || course.includes(kw);
      }
      return true;
    });
  }, [assignments, statusFilter, searchStudent]);

  // Phân trang
  const totalRecords = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  // Xử lý gửi thông báo nhắc nhở
  const handleSendReminder = async (e) => {
    e.preventDefault();
    setSendingReminder(true);
    try {
      await axiosClient.post('/admin/notifications/', {
        title: reminderData.title.trim(),
        content_notification: reminderData.content.trim(),
        notification_type: 'deadline',
        is_read: false,
      });

      setToast({
        type: 'success',
        message: 'Đã gửi thông báo hối thúc khảo sát đến sinh viên thành công!',
      });
      setReminderModalOpen(false);
    } catch (err) {
      console.error('Lỗi gửi thông báo nhắc nhở:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể gửi thông báo.',
      });
    } finally {
      setSendingReminder(false);
    }
  };

  // Xuất file CSV báo cáo tiến độ chi tiết
  const handleExportCSV = () => {
    if (filteredAssignments.length === 0) {
      setToast({ type: 'error', message: 'Không có dữ liệu tiến độ để xuất file.' });
      return;
    }

    const headers = [
      'STT',
      'MSSV',
      'Họ và tên sinh viên',
      'Mã lớp học phần',
      'Tên môn học',
      'Giảng viên phụ trách',
      'Trạng thái',
      'Thời gian phân công',
      'Thời gian hoàn thành',
    ];

    const rows = filteredAssignments.map((a, i) => [
      i + 1,
      a.student_code,
      `"${a.student_name}"`,
      a.section_code,
      `"${a.course_name}"`,
      `"${a.lecturer_name}"`,
      a.status === 'completed'
        ? 'Đã hoàn thành'
        : a.status === 'in_progress'
        ? 'Đang làm dở'
        : 'Chưa bắt đầu',
      a.assigned_at ? new Date(a.assigned_at).toLocaleString('vi-VN') : '',
      a.completed_at ? new Date(a.completed_at).toLocaleString('vi-VN') : '—',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Tien_Do_Khao_Sat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ type: 'success', message: 'Đã xuất file báo cáo tiến độ khảo sát thành công!' });
  };

  // Tính tỷ lệ % hoàn thành an toàn
  const completionRate = Number(overview?.completion_rate || 0);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. THANH ĐIỀU HÀNH LIVE COMMAND CENTER (PHONG CÁCH HIỆN ĐẠI MỚI MẺ) */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002060] via-[#052b82] to-[#0c3997] p-6 text-white shadow-xl">
        {/* NỀN DECORATION HIỆU ỨNG ÁNH SÁNG */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
             
              
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
              Tiến Độ Khảo Sát
            </h1>

            
          </div>

          {/* CỤM NÚT ĐIỀU KHIỂN & CHỌN ĐỢT KHẢO SÁT */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* DROPDOWN CHỌN ĐỢT KHẢO SÁT */}
            <div className="relative min-w-[260px]">
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full appearance-none rounded-xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white shadow-inner backdrop-blur-md outline-none transition focus:bg-white/25 focus:ring-2 focus:ring-amber-400 cursor-pointer border border-white/20"
              >
                {campaigns.map((c) => (
                  <option key={c.campaign_id} value={c.campaign_id} className="text-slate-900 font-semibold">
                    {c.campaign_name} ({c.status === 'open' ? '🟢 Đang mở' : c.status})
                  </option>
                ))}
              </select>
            </div>

            {/* NÚT LÀM MỚI SỐ LIỆU */}
            <button
              type="button"
              onClick={() => {
                fetchDashboardData(selectedCampaignId);
                fetchAssignments(selectedCampaignId);
              }}
              disabled={loading}
              title="Làm mới số liệu"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 border border-white/20"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* NÚT PHÁT THÔNG BÁO NHẮC NHỞ */}
            <button
              type="button"
              onClick={() => setReminderModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-105 active:scale-95 cursor-pointer"
            >
              <Bell size={15} />
              <span>Gửi nhắc nhở làm bài</span>
            </button>
          </div>
        </div>

        {/* CHI TIẾT THỜI GIAN ĐỢT HIỆN TẠI */}
        {currentCampaign && (
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/15 pt-3 text-xs text-blue-200">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-300" />
              <span>
                Thời gian mở cổng:{' '}
                <strong className="text-white">
                  {new Date(currentCampaign.start_survey_campaigns).toLocaleDateString('vi-VN')} –{' '}
                  {new Date(currentCampaign.end_survey_campaigns).toLocaleDateString('vi-VN')}
                </strong>
              </span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-300" />
              <span>
                Trạng thái đợt:{' '}
                <strong className="text-emerald-300 uppercase font-black">
                  {currentCampaign.status === 'open' ? 'ĐANG MỞ CỔNG TIẾP NHẬN' : currentCampaign.status}
                </strong>
              </span>
            </span>
          </div>
        )}
      </div>

      {/* TOAST THÔNG BÁO */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-xs font-medium shadow-md transition-all animate-in fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. KHỐI THỐNG KÊ TRỰC QUAN: GAUGE TỶ LỆ HOÀN THÀNH & 3 THẺ ĐỘNG */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* THẺ ĐẠI DIỆN: VÒNG TRÒN TIẾN ĐỘ TỔNG THỂ */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Tiến độ hoàn thành tổng thể
            </h3>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#002060]">
              <TrendingUp size={16} />
            </span>
          </div>

          <div className="my-5 flex items-center justify-center">
            {/* RADIAL PROGRESS GAUGE */}
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[#002060] transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * Math.min(completionRate, 100)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black tracking-tight text-[#002060]">
                  {completionRate.toLocaleString('vi-VN')}%
                </span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Đã hoàn tất
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Tổng lượt khảo sát giao:</span>
              <strong className="text-slate-900 font-bold">
                {overview?.total_assignments?.toLocaleString() || 0} lượt
              </strong>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Ý kiến phản hồi văn bản:</span>
              <strong className="text-blue-700 font-bold">
                {overview?.total_text_feedback?.toLocaleString() || 0} ý kiến
              </strong>
            </div>
          </div>
        </div>

        {/* 3 THẺ PHỤ: CHI TIẾT TRẠNG THÁI HOÀN THÀNH */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* THẺ 1: ĐÃ HOÀN THÀNH */}
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Đã nộp bài
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <div className="my-3">
              <p className="text-3xl font-black text-emerald-700">
                {overview?.completed_assignments?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">
                Lượt sinh viên đã gửi khảo sát
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* THẺ 2: ĐANG THỰC HIỆN */}
          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Đang làm dở
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock size={16} />
              </span>
            </div>
            <div className="my-3">
              <p className="text-3xl font-black text-amber-700">
                {overview?.in_progress_assignments?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-amber-600 mt-1">
                Sinh viên đang lưu nháp câu trả lời
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    overview?.total_assignments
                      ? ((overview.in_progress_assignments / overview.total_assignments) * 100).toFixed(1)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* THẺ 3: CHƯA THỰC HIỆN */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Chưa bắt đầu
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Users size={16} />
              </span>
            </div>
            <div className="my-3">
              <p className="text-3xl font-black text-slate-800">
                {overview?.not_started_assignments?.toLocaleString() || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Chưa mở phiếu khảo sát
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    overview?.total_assignments
                      ? ((overview.not_started_assignments / overview.total_assignments) * 100).toFixed(1)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MA TRẬN TIẾN ĐỘ THEO KHOA / ĐƠN VỊ (TIÊU BIỂU & TRỰC QUAN) */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#002060]">
              <Building2 size={18} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Tiến độ khảo sát theo từng Khoa / Đơn vị
              </h2>
              <p className="text-[11px] text-slate-500">
                So sánh tỷ lệ sinh viên hoàn thành giữa các khoa trực thuộc
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
              <Trophy size={13} className="text-amber-600" />
              <span>Bảng xếp hạng tiến độ</span>
            </span>
          </div>
        </div>

        {/* DANH SÁCH CÁC KHOA */}
        {facultyProgress.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có số liệu tiến độ theo khoa cho đợt khảo sát này.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyProgress.map((fac, idx) => {
              const rate = Number(fac.rate || 0);
              const isLeader = idx === 0 && rate > 0;

              return (
                <div
                  key={fac.faculty_name}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-white hover:border-slate-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold text-xs text-slate-900">
                          {fac.faculty_name}
                        </span>
                        {isLeader && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-900">
                            <Flame size={10} className="text-amber-600" />
                            Dẫn đầu
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Đã làm: <strong>{fac.completed.toLocaleString()}</strong> / {fac.total.toLocaleString()} lượt
                      </p>
                    </div>

                    <span className="text-base font-black text-[#002060] shrink-0">
                      {rate.toLocaleString('vi-VN')}%
                    </span>
                  </div>

                  {/* THANH PROGRESS BAR GRADIENT */}
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#002060] to-blue-600 transition-all duration-700"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. BẢNG GIÁM SÁT CHI TIẾT TỪNG LƯỢT KHẢO SÁT (ASSIGNMENTS AUDIT) */}
      {/* ============================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#002060]">
              <Users size={18} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Chi tiết lượt phân công khảo sát sinh viên
              </h2>
              <p className="text-[11px] text-slate-500">
                Tra cứu trạng thái nộp bài của từng sinh viên theo môn học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Download size={14} />
              <span>Xuất báo cáo CSV</span>
            </button>
          </div>
        </div>

        {/* THANH LỌC TRẠNG THÁI & TÌM KIẾM */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-[#002060] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({assignments.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('completed');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Đã nộp bài ({assignments.filter((a) => a.status === 'completed').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('in_progress');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Đang làm dở ({assignments.filter((a) => a.status === 'in_progress').length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('not_started');
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'not_started'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chưa bắt đầu ({assignments.filter((a) => a.status === 'not_started').length})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => {
                setSearchStudent(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo MSSV, Họ tên, Mã LHP..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#002060] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-[#002060]">
              <tr>
                <th className="px-3.5 py-3 text-center w-12">STT</th>
                <th className="px-3.5 py-3">MSSV</th>
                <th className="px-3.5 py-3">Họ và tên sinh viên</th>
                <th className="px-3.5 py-3">Mã lớp học phần</th>
                <th className="px-3.5 py-3">Học phần / Giảng viên</th>
                <th className="px-3.5 py-3 text-center">Trạng thái</th>
                <th className="px-3.5 py-3">Thời gian hoàn thành</th>
                <th className="px-3.5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#002060]" />
                    <span>Đang tải danh sách lượt làm bài...</span>
                  </td>
                </tr>
              ) : paginatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                    Không tìm thấy lượt làm bài nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((a, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const isCompleted = a.status === 'completed';
                  const isInProgress = a.status === 'in_progress';

                  return (
                    <tr key={a.assignment_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-3 text-center font-bold text-slate-400">
                        {rowNum}
                      </td>

                      <td className="px-3.5 py-3 font-bold text-slate-900">
                        {a.student_code}
                      </td>

                      <td className="px-3.5 py-3 font-semibold text-slate-800">
                        {a.student_name}
                      </td>

                      <td className="px-3.5 py-3 font-mono">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                          {a.section_code}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <p className="font-semibold text-slate-800 leading-tight">
                          {a.course_name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          GV: {a.lecturer_name}
                        </p>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Đã nộp bài
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            <Clock size={12} /> Đang làm dở
                          </span>
                        )}
                        {!isCompleted && !isInProgress && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            Chưa bắt đầu
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-xs text-slate-500">
                        {a.completed_at ? (
                          new Date(a.completed_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-400 italic">Chưa nộp</span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetailModal({ open: true, item: a })}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <p>
            Hiển thị{' '}
            <strong className="text-slate-800">
              {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{' '}
              {Math.min(currentPage * pageSize, totalRecords)}
            </strong>{' '}
            trên tổng số <strong className="text-slate-800">{totalRecords}</strong> lượt phân công
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 rounded-lg text-xs font-bold ${
                  p === currentPage
                    ? 'bg-[#002060] text-white shadow-sm'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. MODAL PHÁT THÔNG BÁO NHẮC NHỞ LÀM BÀI KHẢO SÁT */}
      {/* ============================================================== */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#002060] to-blue-900 px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell size={18} className="text-amber-300" />
                Gửi thông báo hối thúc hoàn thành khảo sát
              </h3>
              <button
                type="button"
                onClick={() => setReminderModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đối tượng tiếp nhận thông báo
                </label>
                <select
                  value={reminderData.target}
                  onChange={(e) => setReminderData({ ...reminderData, target: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="not_started">
                    Chỉ gửi sinh viên chưa hoàn thành (Còn thiếu bài)
                  </option>
                  <option value="all">Tất cả sinh viên trong học kỳ này</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reminderData.title}
                  onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung chi tiết nhắc nhở <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reminderData.content}
                  onChange={(e) => setReminderData({ ...reminderData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setReminderModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={sendingReminder}
                  className="flex items-center gap-1.5 rounded-xl bg-[#002060] px-5 py-2 font-bold text-white shadow-md hover:bg-[#001748] transition disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{sendingReminder ? 'Đang phát thông báo...' : 'Phát thông báo ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL XEM CHI TIẾT LƯỢT LÀM BÀI */}
      {/* ============================================================== */}
      {detailModal.open && detailModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Eye size={18} />
                Chi tiết lượt phân công #{detailModal.item.assignment_id}
              </h3>
              <button
                type="button"
                onClick={() => setDetailModal({ open: false, item: null })}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] text-slate-400 block font-medium">Sinh viên</span>
                <span className="font-bold text-sm text-slate-900 block">
                  {detailModal.item.student_name}
                </span>
                <span className="text-xs text-blue-700 font-mono">MSSV: {detailModal.item.student_code}</span>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <span className="text-[10px] text-slate-400 block font-medium">Học phần đánh giá</span>
                <span className="font-bold text-xs text-slate-900 block">
                  {detailModal.item.course_name}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Lớp HP: <strong>{detailModal.item.section_code}</strong> • GV: {detailModal.item.lecturer_name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-400 block font-medium">Trạng thái</span>
                  <span
                    className={`font-bold mt-1 inline-block ${
                      detailModal.item.status === 'completed'
                        ? 'text-emerald-600'
                        : detailModal.item.status === 'in_progress'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {detailModal.item.status === 'completed'
                      ? 'Đã nộp bài'
                      : detailModal.item.status === 'in_progress'
                      ? 'Đang làm dở'
                      : 'Chưa bắt đầu'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-400 block font-medium">Ngày nộp</span>
                  <span className="font-semibold text-slate-700 block mt-1">
                    {detailModal.item.completed_at
                      ? new Date(detailModal.item.completed_at).toLocaleDateString('vi-VN')
                      : 'Chưa có'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailModal({ open: false, item: null })}
                  className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white hover:bg-[#001748] transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
