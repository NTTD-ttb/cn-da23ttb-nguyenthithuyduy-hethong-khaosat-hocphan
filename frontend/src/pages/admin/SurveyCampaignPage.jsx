import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Square,
  Eye,
  RefreshCw,
  FileText,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  BookOpen,
  BarChart3,
  Edit2,
  Lock,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

// Cấu hình nhãn và màu sắc hiển thị cho trạng thái đợt khảo sát
const STATUS_CONFIG = {
  open: {
    label: 'Đang mở cổng',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    dotClass: 'bg-emerald-500 animate-pulse',
    desc: 'Sinh viên đang thực hiện khảo sát',
  },
  scheduled: {
    label: 'Sắp diễn ra',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
    dotClass: 'bg-amber-500',
    desc: 'Đã lên lịch mở tự động',
  },
  closed: {
    label: 'Đã kết thúc',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-100',
    dotClass: 'bg-slate-400',
    desc: 'Cổng khảo sát đã khóa',
  },
  draft: {
    label: 'Bản nháp',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
    dotClass: 'bg-blue-500',
    desc: 'Đang cấu hình thiết lập',
  },
};

export default function SurveyCampaignPage() {
  const navigate = useNavigate();

  // Tab chính: 'campaigns' (Đợt khảo sát) hoặc 'templates' (Bộ câu hỏi)
  const [activeTab, setActiveTab] = useState('campaigns');

  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // State tìm kiếm và lọc đợt khảo sát
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('');

  // State Modal Tạo mới Đợt khảo sát
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    term_id: '',
    template_id: '',
    start_survey_campaigns: '',
    end_survey_campaigns: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  // State Modal Đổi trạng thái đợt khảo sát
  const [statusModal, setStatusModal] = useState({
    open: false,
    campaign: null,
    targetStatus: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // State Modal Xem chi tiết Bộ câu hỏi
  const [templateDetailModal, setTemplateDetailModal] = useState({
    open: false,
    template: null,
    questions: [],
    loading: false,
  });

  // Tự động tắt Toast thông báo sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tải danh sách đợt khảo sát
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/survey-campaigns/?limit=100');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setCampaigns(list);
    } catch (err) {
      console.error('Lỗi tải danh sách đợt khảo sát:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tải danh sách đợt khảo sát.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách bộ câu hỏi (templates)
  const fetchTemplates = async () => {
    try {
      const res = await axiosClient.get('/admin/survey-templates/?limit=100');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setTemplates(list);
    } catch (err) {
      console.error('Lỗi tải bộ câu hỏi:', err);
    }
  };

  // Tải danh sách học kỳ
  const fetchTerms = async () => {
    try {
      const res = await axiosClient.get('/admin/academic-terms/?limit=100');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setTerms(list);
    } catch (err) {
      console.error('Lỗi tải danh mục học kỳ:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchTerms();
  }, []);

  // Lấy tên học kỳ theo ID
  const getTermName = (termId) => {
    const t = terms.find((item) => item.term_id === Number(termId));
    return t ? `${t.term_name} (${t.academic_year})` : `Học kỳ #${termId}`;
  };

  // Lấy tên bộ câu hỏi theo ID
  const getTemplateName = (templateId) => {
    const tmpl = templates.find((item) => item.template_id === Number(templateId));
    return tmpl ? tmpl.template_name : `Biểu mẫu #${templateId}`;
  };

  // Thống kê nhanh chỉ số KPI các đợt khảo sát
  const stats = useMemo(() => {
    const total = campaigns.length;
    const open = campaigns.filter((c) => c.status === 'open').length;
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
    const closed = campaigns.filter((c) => c.status === 'closed').length;
    const draft = campaigns.filter((c) => c.status === 'draft').length;
    return { total, open, scheduled, closed, draft };
  }, [campaigns]);

  // Lọc danh sách đợt khảo sát theo từ khóa, trạng thái, học kỳ
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      if (termFilter && String(c.term_id) !== String(termFilter)) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const name = c.campaign_name?.toLowerCase() || '';
        const term = getTermName(c.term_id).toLowerCase();
        return name.includes(kw) || term.includes(kw);
      }
      return true;
    });
  }, [campaigns, statusFilter, termFilter, searchKeyword, terms]);

  // Mở modal Tạo đợt khảo sát mới
  const handleOpenCreate = () => {
    // Tự sinh ngày bắt đầu từ ngày mai, kết thúc sau 30 ngày
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    const defaultTerm = terms[0]?.term_id || '';
    const defaultTemplate = templates[0]?.template_id || '';

    setFormData({
      campaign_name: 'Khảo sát ý kiến sinh viên về hoạt động giảng dạy',
      term_id: defaultTerm,
      template_id: defaultTemplate,
      start_survey_campaigns: start,
      end_survey_campaigns: end,
      status: 'draft',
    });
    setCreateModalOpen(true);
  };

  // Gửi tạo đợt khảo sát mới
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        campaign_name: formData.campaign_name.trim(),
        term_id: Number(formData.term_id),
        template_id: Number(formData.template_id),
        start_survey_campaigns: new Date(formData.start_survey_campaigns).toISOString(),
        end_survey_campaigns: new Date(formData.end_survey_campaigns).toISOString(),
        status: formData.status,
      };

      await axiosClient.post('/admin/survey-campaigns/', payload);
      setToast({
        type: 'success',
        message: 'Khởi tạo đợt khảo sát mới thành công!',
      });
      setCreateModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.error('Lỗi tạo đợt khảo sát:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tạo đợt khảo sát mới.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal xác nhận đổi trạng thái đợt khảo sát
  const handleRequestStatusChange = (campaign, targetStatus) => {
    setStatusModal({
      open: true,
      campaign,
      targetStatus,
    });
  };

  // Thực hiện đổi trạng thái đợt khảo sát
  const handleConfirmStatusChange = async () => {
    if (!statusModal.campaign || !statusModal.targetStatus) return;
    setUpdatingStatus(true);
    try {
      await axiosClient.patch(
        `/admin/survey-campaigns/${statusModal.campaign.campaign_id}/status`,
        { status: statusModal.targetStatus }
      );

      const statusName = STATUS_CONFIG[statusModal.targetStatus]?.label || statusModal.targetStatus;
      setToast({
        type: 'success',
        message: `Đã cập nhật trạng thái đợt khảo sát thành "${statusName}".`,
      });

      setStatusModal({ open: false, campaign: null, targetStatus: '' });
      fetchCampaigns();
    } catch (err) {
      console.error('Lỗi đổi trạng thái đợt:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể đổi trạng thái đợt khảo sát.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Mở popup xem chi tiết bộ câu hỏi
  const handleViewTemplateDetails = async (templateId) => {
    setTemplateDetailModal({
      open: true,
      template: null,
      questions: [],
      loading: true,
    });

    try {
      const res = await axiosClient.get(`/admin/survey-templates/${templateId}`);
      const data = res?.data !== undefined ? res.data : res;
      setTemplateDetailModal({
        open: true,
        template: data,
        questions: data.questions || [],
        loading: false,
      });
    } catch (err) {
      console.error('Lỗi tải chi tiết bộ câu hỏi:', err);
      setToast({
        type: 'error',
        message: 'Không thể tải chi tiết biểu mẫu câu hỏi.',
      });
      setTemplateDetailModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Định dạng ngày giờ hiển thị
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Phân nhóm câu hỏi theo tiền tố mã câu hỏi (Q_A_, Q_B_, Q_C_, Q_D_)
  const groupedQuestions = useMemo(() => {
    const list = templateDetailModal.questions || [];
    return {
      partA: list.filter((q) => q.question_code.startsWith('Q_A_') || q.display_order <= 18),
      partB: list.filter((q) => q.question_code.startsWith('Q_B_') || (q.display_order >= 19 && q.display_order <= 25)),
      partC: list.filter((q) => q.question_code.startsWith('Q_C_') || (q.display_order >= 26 && q.display_order <= 29)),
      partD: list.filter((q) => q.question_code.startsWith('Q_D_') || q.display_order >= 30),
    };
  }, [templateDetailModal.questions]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. HEADER CARD TIÊU ĐỀ & NÚT THAO TÁC */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#002060] via-[#052b82] to-[#0d3f9f] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <ClipboardCheck size={24} className="text-amber-300" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Quản Lý Đợt Khảo Sát & Bộ Câu Hỏi
              </h1>
              <p className="text-xs text-blue-100 sm:text-sm">
                Thiết lập đợt khảo sát ý kiến sinh viên, kiểm soát đóng/mở cổng và liên kết biểu mẫu đánh giá
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                fetchCampaigns();
                fetchTemplates();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-300 active:scale-95"
            >
              <Plus size={16} />
              <span>Tạo đợt khảo sát mới</span>
            </button>
          </div>
        </div>

        {/* 4 THẺ THỐNG KÊ KPI ĐỢT KHẢO SÁT */}
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Tổng đợt khảo sát</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Đang mở cổng ĐBCL</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">{stats.open}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Sắp diễn ra</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{stats.scheduled}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Đã kết thúc / Đóng</p>
            <p className="mt-1 text-2xl font-black text-slate-300">{stats.closed}</p>
          </div>
        </div>
      </div>

      {/* TOAST THÔNG BÁO KẾT QUẢ */}
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
      {/* 2. CHUYỂN ĐỔI TAB (ĐỢT KHẢO SÁT | BỘ CÂU HỎI & BIỂU MẪU) */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'campaigns'
              ? 'bg-[#002060] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar size={15} />
          <span>Danh sách Đợt khảo sát ({campaigns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === 'templates'
              ? 'bg-[#002060] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen size={15} />
          <span>Bộ biểu mẫu câu hỏi TVU ({templates.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. NỘI DUNG TAB 1: DANH SÁCH CÁC ĐỢT KHẢO SÁT */}
      {/* ============================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* THANH TÌM KIẾM & BỘ LỌC */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative min-w-[260px] flex-1 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm đợt khảo sát theo tên, học kỳ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs outline-none focus:border-[#002060] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* LỌC TRẠNG THÁI */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="open">Đang mở cổng (Open)</option>
                <option value="scheduled">Sắp diễn ra (Scheduled)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="closed">Đã đóng cổng (Closed)</option>
              </select>

              {/* LỌC HỌC KỲ */}
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả học kỳ</option>
                {terms.map((t) => (
                  <option key={t.term_id} value={t.term_id}>
                    {t.term_name} — {t.academic_year}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] font-semibold text-slate-500">
              Hiển thị: <span className="font-bold text-[#002060]">{filteredCampaigns.length}</span> đợt khảo sát
            </div>
          </div>

          {/* DANH SÁCH ĐỢT KHẢO SÁT DẠNG THẺ THÔNG MINH */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 rounded-2xl bg-white border border-slate-200">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#002060]" />
              <p className="text-xs">Đang tải danh sách đợt khảo sát...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="py-16 text-center text-slate-400 rounded-2xl bg-white border border-slate-200">
              <ClipboardCheck size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">Chưa có đợt khảo sát nào phù hợp.</p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy nhấn nút &ldquo;Tạo đợt khảo sát mới&rdquo; ở góc trên để kích hoạt đợt khảo sát.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCampaigns.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                const termName = getTermName(c.term_id);
                const templateName = getTemplateName(c.template_id);

                return (
                  <div
                    key={c.campaign_id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border ring-1 ${statusCfg.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                          {statusCfg.label}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          Mã đợt #{c.campaign_id}
                        </span>

                        <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#002060]">
                          {termName}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {c.campaign_name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={14} className="text-slate-400" />
                          <span>
                            Biểu mẫu: <strong className="text-slate-700">{templateName}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <span>
                            Thời gian: {formatDateTime(c.start_survey_campaigns)} → {formatDateTime(c.end_survey_campaigns)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CỤM NÚT ĐIỀU KHIỂN ĐỢT KHẢO SÁT */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 shrink-0">
                      {/* NÚT XEM TIẾN ĐỘ */}
                      <button
                        type="button"
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <BarChart3 size={14} />
                        <span>Xem tiến độ</span>
                      </button>

                      {/* NÚT MỞ ĐỢT KHẢO SÁT */}
                      {c.status !== 'open' && (
                        <button
                          type="button"
                          onClick={() => handleRequestStatusChange(c, 'open')}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                          <Play size={14} />
                          <span>Mở cổng ĐBCL</span>
                        </button>
                      )}

                      {/* NÚT ĐÓNG CỔNG KHẢO SÁT */}
                      {c.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleRequestStatusChange(c, 'closed')}
                          className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
                        >
                          <Square size={14} />
                          <span>Khóa cổng</span>
                        </button>
                      )}

                      {/* NÚT XEM CÂU HỎI */}
                      <button
                        type="button"
                        onClick={() => handleViewTemplateDetails(c.template_id)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#002060] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#001748] transition"
                      >
                        <Eye size={14} />
                        <span>Xem 32 câu hỏi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. NỘI DUNG TAB 2: QUẢN LÝ BỘ CÂU HỎI KHẢO SÁT (TEMPLATES) */}
      {/* ============================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div
                key={t.template_id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#002060]">
                      Phiên bản v{t.version_number}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        t.status_survey_template === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status_survey_template === 'active' ? 'Đang áp dụng' : 'Bản nháp'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-extrabold text-slate-900 leading-snug">
                    {t.template_name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Áp dụng cho: <strong>{getTermName(t.term_id)}</strong>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Layers size={14} />
                    Cấu trúc: <strong>32 câu hỏi chuẩn TVU (A, B, C, D)</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleViewTemplateDetails(t.template_id)}
                    className="inline-flex items-center gap-1 font-bold text-[#002060] hover:underline"
                  >
                    <span>Xem nội dung</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL TẠO MỚI ĐỢT KHẢO SÁT */}
      {/* ============================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus size={18} />
                Khởi tạo đợt khảo sát ý kiến sinh viên mới
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên đợt khảo sát <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Ví dụ: Khảo sát ý kiến sinh viên Học kỳ I (2026 - 2027)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Học kỳ triển khai <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.term_id}
                    onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Chọn học kỳ --</option>
                    {terms.map((t) => (
                      <option key={t.term_id} value={t.term_id}>
                        {t.term_name} ({t.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bộ biểu mẫu câu hỏi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Chọn biểu mẫu --</option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.template_id} value={tmpl.template_id}>
                        {tmpl.template_name} (v{tmpl.version_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời gian mở cổng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_survey_campaigns}
                    onChange={(e) => setFormData({ ...formData, start_survey_campaigns: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời gian đóng cổng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_survey_campaigns}
                    onChange={(e) => setFormData({ ...formData, end_survey_campaigns: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Trạng thái khởi tạo
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="draft">Bản nháp (Draft - Chưa mở)</option>
                  <option value="scheduled">Lên lịch mở (Scheduled)</option>
                  <option value="open">Mở cổng ngay (Open - Tự động sinh lượt làm bài)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white shadow-md hover:bg-[#001748] transition disabled:opacity-50"
                >
                  {submitting ? 'Đang khởi tạo...' : 'Lưu đợt khảo sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL XÁC NHẬN ĐỔI TRẠNG THÁI (MỞ / ĐÓNG CỔNG) */}
      {/* ============================================================== */}
      {statusModal.open && statusModal.campaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center text-xs">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-3 ${
                statusModal.targetStatus === 'open'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {statusModal.targetStatus === 'open' ? <Play size={22} /> : <Lock size={22} />}
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {statusModal.targetStatus === 'open'
                ? 'Xác nhận mở cổng khảo sát ĐBCL'
                : 'Xác nhận khóa / đóng đợt khảo sát'}
            </h3>

            <p className="mt-2 text-slate-600 leading-relaxed">
              Bạn đang chuyển đợt khảo sát{' '}
              <strong className="text-slate-900 font-bold">
                {statusModal.campaign.campaign_name}
              </strong>{' '}
              sang trạng thái{' '}
              <span className="font-extrabold text-[#002060]">
                {STATUS_CONFIG[statusModal.targetStatus]?.label}
              </span>
              .
            </p>

            {statusModal.targetStatus === 'open' && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-left text-[11px] text-emerald-800 leading-relaxed border border-emerald-200">
                ⚡ <strong>Hệ thống tự động:</strong> Khi chuyển sang trạng thái <strong>ĐANG MỞ</strong>, hệ thống sẽ tự động quét danh sách sinh viên đã đăng ký học phần trong học kỳ này và sinh các lượt phân công khảo sát tương ứng.
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStatusModal({ open: false, campaign: null, targetStatus: '' })}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleConfirmStatusChange}
                className={`rounded-xl px-5 py-2 font-bold text-white shadow-md transition disabled:opacity-50 ${
                  statusModal.targetStatus === 'open'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {updatingStatus ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL XEM CHI TIẾT BỘ 32 CÂU HỎI THEO CHUẨN ĐBCL TVU */}
      {/* ============================================================== */}
      {templateDetailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen size={18} />
                <div>
                  <h3 className="text-sm font-bold">
                    {templateDetailModal.template?.template_name || 'Bộ câu hỏi khảo sát'}
                  </h3>
                  <p className="text-[10px] text-blue-200 mt-0.5">
                    Cấu trúc 32 câu hỏi đánh giá theo chuẩn ĐBCL Trường Kỹ thuật và Công nghệ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTemplateDetailModal({ open: false, template: null, questions: [], loading: false })}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {templateDetailModal.loading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#002060]" />
                  <span>Đang nạp 32 câu hỏi khảo sát...</span>
                </div>
              ) : (
                <>
                  {/* PHẦN A */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                      <span className="font-extrabold text-[#002060] uppercase text-[11px] tracking-wide">
                        PHẦN A. ĐÁNH GIÁ HOẠT ĐỘNG GIẢNG DẠY CỦA GIẢNG VIÊN (18 CÂU)
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[#002060]">
                        Thang đo 1 - 5 (Rating)
                      </span>
                    </div>
                    <div className="space-y-1.5 divide-y divide-blue-100/60 text-slate-700">
                      {groupedQuestions.partA.map((q) => (
                        <div key={q.question_id} className="pt-1.5 flex items-start gap-2">
                          <span className="font-mono font-bold text-[#002060] shrink-0 w-16">
                            {q.question_code}
                          </span>
                          <span className="flex-1">{q.question_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN B */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                      <span className="font-extrabold text-emerald-800 uppercase text-[11px] tracking-wide">
                        PHẦN B. NỘI DUNG MÔN HỌC & HỌC LIỆU (7 CÂU)
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Thang đo 1 - 5 (Rating)
                      </span>
                    </div>
                    <div className="space-y-1.5 divide-y divide-emerald-100/60 text-slate-700">
                      {groupedQuestions.partB.map((q) => (
                        <div key={q.question_id} className="pt-1.5 flex items-start gap-2">
                          <span className="font-mono font-bold text-emerald-800 shrink-0 w-16">
                            {q.question_code}
                          </span>
                          <span className="flex-1">{q.question_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN C */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <span className="font-extrabold text-amber-800 uppercase text-[11px] tracking-wide">
                        PHẦN C. KHỐI LƯỢNG VÀ THỜI LƯỢNG HỌC TẬP (4 CÂU)
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Rating & Lựa chọn
                      </span>
                    </div>
                    <div className="space-y-1.5 divide-y divide-amber-100/60 text-slate-700">
                      {groupedQuestions.partC.map((q) => (
                        <div key={q.question_id} className="pt-1.5 flex items-start gap-2">
                          <span className="font-mono font-bold text-amber-800 shrink-0 w-16">
                            {q.question_code}
                          </span>
                          <span className="flex-1">{q.question_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PHẦN D */}
                  <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                      <span className="font-extrabold text-purple-800 uppercase text-[11px] tracking-wide">
                        PHẦN D. Ý KIẾN ĐÓNG GÓP & ĐỀ XUẤT CẢI TIẾN (3 CÂU - PHÂN TÍCH NLP AI)
                      </span>
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                        Văn bản tự luận (Text)
                      </span>
                    </div>
                    <div className="space-y-1.5 divide-y divide-purple-100/60 text-slate-700">
                      {groupedQuestions.partD.map((q) => (
                        <div key={q.question_id} className="pt-1.5 flex items-start gap-2">
                          <span className="font-mono font-bold text-purple-800 shrink-0 w-16">
                            {q.question_code}
                          </span>
                          <span className="flex-1">{q.question_text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setTemplateDetailModal({ open: false, template: null, questions: [], loading: false })}
                className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white hover:bg-[#001748] transition cursor-pointer"
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
