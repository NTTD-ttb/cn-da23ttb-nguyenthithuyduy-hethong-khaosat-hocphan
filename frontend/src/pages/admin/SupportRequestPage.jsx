import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LifeBuoy,
  Bell,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Edit3,
  Trash2,
  Plus,
  X,
  User,
  Mail,
  Copy,
  Check,
  Calendar,
  Sparkles,
  HelpCircle,
  BookOpen,
  Radio,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const PaginationControls = ({
  page,
  pageSize,
  totalRecords,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span>Số mục mỗi trang:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>
          Hiển thị <strong className="text-slate-800">{firstRecord}–{lastRecord}</strong> của{' '}
          <strong className="text-slate-800">{totalRecords}</strong> {itemLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 self-center sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-20 text-center font-medium">
          Trang {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// Phân loại yêu cầu hỗ trợ
const REQUEST_TYPE_CONFIG = {
  sai_thong_tin: {
    label: 'Sai thông tin',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  khong_thay_hoc_phan: {
    label: 'Không thấy học phần',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  loi_lam_bai: {
    label: 'Lỗi kỹ thuật làm bài',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  gop_y: {
    label: 'Góp ý hệ thống',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  khac: {
    label: 'Khác',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

// Trạng thái xử lý
const STATUS_CONFIG = {
  pending: {
    label: 'Chờ tiếp nhận',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500 animate-pulse',
  },
  in_progress: {
    label: 'Đang xử lý',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
  },
  resolved: {
    label: 'Đã giải quyết',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  closed: {
    label: 'Đã đóng',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
  },
};

// Loại thông báo hệ thống
const NOTIF_TYPE_CONFIG = {
  survey: {
    label: 'Đợt khảo sát',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FileText,
    iconColor: 'text-blue-600 bg-blue-100',
  },
  deadline: {
    label: 'Nhắc hạn chót',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 bg-amber-100',
  },
  support: {
    label: 'Hỗ trợ kỹ thuật',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: LifeBuoy,
    iconColor: 'text-purple-600 bg-purple-100',
  },
  general: {
    label: 'Thông báo chung',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Bell,
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
};


const SupportRequestPage = () => {
  // Tab chính: 'requests' (Hộp thư hỗ trợ) | 'notifications' (Thông báo hệ thống)
  const [activeTab, setActiveTab] = useState('requests');

  // Dữ liệu Yêu cầu hỗ trợ
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestStats, setRequestStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  // Lọc & tìm kiếm Yêu cầu
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(10);

  // Modal Xử lý / Phản hồi yêu cầu
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyForm, setReplyForm] = useState({
    status: 'in_progress',
    admin_note: '',
  });
  const [submittingReply, setSubmittingReply] = useState(false);

  // Dữ liệu Thông báo
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifTypeFilter, setNotifTypeFilter] = useState('all');
  const [notifPage, setNotifPage] = useState(1);
  const [notifPageSize, setNotifPageSize] = useState(10);

  // Modal Tạo / Sửa Thông báo
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [editingNotif, setEditingNotif] = useState(null);
  const [notifForm, setNotifForm] = useState({
    title: '',
    content_notification: '',
    notification_type: 'survey',
    user_id: '',
  });
  const [submittingNotif, setSubmittingNotif] = useState(false);

  // Toast / feedback message
  const [feedback, setFeedback] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(`Đã sao chép email: ${email}`, 'success');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // 1. Tải danh sách & thống kê yêu cầu hỗ trợ
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      // Tải song song cả danh sách và thống kê
      const [listRes, statsRes] = await Promise.all([
        axiosClient.get('/admin/contact-requests/', {
          params: {
            status: requestStatusFilter === 'all' ? undefined : requestStatusFilter,
            request_type: requestTypeFilter === 'all' ? undefined : requestTypeFilter,
            search: requestSearch.trim() || undefined,
            limit: 150,
          },
        }),
        axiosClient.get('/admin/contact-requests/stats').catch(() => null),
      ]);

      const data = listRes?.data || listRes || [];
      setRequests(Array.isArray(data) ? data : []);

      if (statsRes?.data) {
        setRequestStats(statsRes.data);
      } else if (Array.isArray(data)) {
        // Fallback tự tính nếu endpoint stats chưa sẵn sàng
        const counts = { total: data.length, pending: 0, in_progress: 0, resolved: 0, closed: 0 };
        data.forEach((r) => {
          if (counts[r.status_contact_request] !== undefined) {
            counts[r.status_contact_request]++;
          }
        });
        setRequestStats(counts);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu cầu hỗ trợ:', err);
      showToast('Không thể tải danh sách yêu cầu hỗ trợ. Vui lòng thử lại.', 'error');
    } finally {
      setLoadingRequests(false);
    }
  }, [requestStatusFilter, requestTypeFilter, requestSearch]);

  // 2. Tải danh sách thông báo
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await axiosClient.get('/admin/notifications/', {
        params: { limit: 100 },
      });
      const data = res?.data || res || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
      showToast('Không thể tải danh sách thông báo.', 'error');
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, fetchNotifications]);

  // Mở modal phản hồi
  const handleOpenReplyModal = (req) => {
    setSelectedRequest(req);
    setReplyForm({
      status: req.status_contact_request || 'in_progress',
      admin_note: req.admin_note || '',
    });
  };

  // Submit phản hồi yêu cầu
  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmittingReply(true);
    try {
      await axiosClient.put(`/admin/contact-requests/${selectedRequest.request_id}`, {
        status_contact_request: replyForm.status,
        admin_note: replyForm.admin_note.trim(),
      });
      showToast('Đã lưu phản hồi và cập nhật trạng thái yêu cầu thành công!', 'success');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Lỗi khi lưu phản hồi:', err);
      showToast(err?.response?.data?.detail || 'Không thể lưu phản hồi. Vui lòng thử lại.', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Xóa yêu cầu
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa yêu cầu hỗ trợ này khỏi hệ thống?')) return;
    try {
      await axiosClient.delete(`/admin/contact-requests/${requestId}`);
      showToast('Đã xóa yêu cầu hỗ trợ.', 'success');
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
      setRequestStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err) {
      console.error('Lỗi khi xóa yêu cầu:', err);
      showToast('Không thể xóa yêu cầu.', 'error');
    }
  };

  // Mở modal tạo / sửa thông báo
  const handleOpenNotifModal = (notif = null) => {
    if (notif) {
      setEditingNotif(notif);
      setNotifForm({
        title: notif.title || '',
        content_notification: notif.content_notification || '',
        notification_type: notif.notification_type || 'survey',
        user_id: notif.user_id ? String(notif.user_id) : '',
      });
    } else {
      setEditingNotif(null);
      setNotifForm({
        title: '',
        content_notification: '',
        notification_type: 'survey',
        user_id: '',
      });
    }
    setShowNotifModal(true);
  };

  // Submit lưu thông báo
  const handleSaveNotif = async (e) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.content_notification.trim()) {
      showToast('Vui lòng điền đầy đủ tiêu đề và nội dung thông báo.', 'error');
      return;
    }

    setSubmittingNotif(true);
    try {
      const payload = {
        title: notifForm.title.trim(),
        content_notification: notifForm.content_notification.trim(),
        notification_type: notifForm.notification_type,
        user_id: notifForm.user_id ? parseInt(notifForm.user_id, 10) : null,
      };

      if (editingNotif) {
        await axiosClient.put(`/admin/notifications/${editingNotif.notification_id}`, payload);
        showToast('Đã cập nhật thông báo thành công!', 'success');
      } else {
        await axiosClient.post('/admin/notifications/', payload);
        showToast('Đã phát hành thông báo mới thành công!', 'success');
      }
      setShowNotifModal(false);
      setNotifPage(1);
      fetchNotifications();
    } catch (err) {
      console.error('Lỗi khi lưu thông báo:', err);
      showToast(err?.response?.data?.detail || 'Không thể lưu thông báo. Vui lòng kiểm tra lại.', 'error');
    } finally {
      setSubmittingNotif(false);
    }
  };

  // Xóa thông báo
  const handleDeleteNotif = async (notifId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này? Hành động này sẽ gỡ thông báo khỏi sinh viên.')) return;
    try {
      await axiosClient.delete(`/admin/notifications/${notifId}`);
      showToast('Đã xóa thông báo.', 'success');
      setNotifications((prev) => prev.filter((n) => n.notification_id !== notifId));
    } catch (err) {
      console.error('Lỗi khi xóa thông báo:', err);
      showToast('Không thể xóa thông báo.', 'error');
    }
  };

  // Lọc thông báo ở phía client
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchType = notifTypeFilter === 'all' || item.notification_type === notifTypeFilter;
      const q = notifSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content_notification && item.content_notification.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [notifications, notifTypeFilter, notifSearch]);

  const totalRequestPages = Math.max(1, Math.ceil(requests.length / requestPageSize));
  const currentRequestPage = Math.min(requestPage, totalRequestPages);
  const paginatedRequests = useMemo(() => {
    const start = (currentRequestPage - 1) * requestPageSize;
    return requests.slice(start, start + requestPageSize);
  }, [requests, currentRequestPage, requestPageSize]);

  const totalNotifPages = Math.max(1, Math.ceil(filteredNotifications.length / notifPageSize));
  const currentNotifPage = Math.min(notifPage, totalNotifPages);
  const paginatedNotifications = useMemo(() => {
    const start = (currentNotifPage - 1) * notifPageSize;
    return filteredNotifications.slice(start, start + notifPageSize);
  }, [filteredNotifications, currentNotifPage, notifPageSize]);

  // Helper render format date
  const formatDateTime = (val) => {
    if (!val) return 'Chưa cập nhật';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return val;
    }
  };

  // Helper render badge request type
  const renderRequestType = (type) => {
    const config = REQUEST_TYPE_CONFIG[type] || {
      label: type || 'Yêu cầu',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.badge}`}>
        {config.label}
      </span>
    );
  };

  // Helper render badge request status
  const renderRequestStatus = (status) => {
    const config = STATUS_CONFIG[status] || {
      label: status || 'Chưa rõ',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all duration-300 animate-slide-in ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* HEADER TRANG */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#002060]/10 flex items-center justify-center text-[#002060]">
                <LifeBuoy size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Quản lý Thông báo và Yêu cầu Hỗ trợ
                </h1>
                
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'requests' ? (
              <button
                type="button"
                onClick={fetchRequests}
                disabled={loadingRequests}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-sm disabled:opacity-60"
              >
                <RefreshCw size={15} className={loadingRequests ? 'animate-spin' : ''} />
                <span>Làm mới hộp thư</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenNotifModal(null)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold text-white bg-[#002060] hover:bg-[#002060]/90 rounded-xl shadow-sm transition hover:shadow"
              >
                <Plus size={16} />
                <span>Tạo thông báo mới</span>
              </button>
            )}
          </div>
        </div>

        {/* TABS SWITCHER */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200/80 -mb-5 md:-mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-[#002060] text-[#002060]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={17} />
            <span>Yêu cầu hỗ trợ & Phản hồi</span>
            {requestStats.pending > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                {requestStats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-[#002060] text-[#002060]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell size={17} />
            <span>Thông báo hệ thống</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
              {notifications.length}
            </span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: YÊU CẦU HỖ TRỢ SINH VIÊN ======================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* KPI CARDS THỐNG KÊ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tổng số */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số yêu cầu</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{requestStats.total}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tiếp nhận từ sinh viên</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers size={22} />
              </div>
            </div>

            {/* Chờ tiếp nhận */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-amber-50/40">
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Chờ tiếp nhận</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{requestStats.pending}</h3>
                <p className="text-xs text-amber-600/80 mt-0.5">Cần ưu tiên xử lý</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock size={22} className="animate-pulse" />
              </div>
            </div>

            {/* Đang xử lý */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-blue-200/80 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-blue-50/40">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Đang xử lý</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">{requestStats.in_progress}</h3>
                <p className="text-xs text-blue-600/80 mt-0.5">Đã tiếp nhận đối soát</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <RefreshCw size={22} />
              </div>
            </div>

            {/* Đã giải quyết */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
              <div>
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Đã giải quyết</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{requestStats.resolved}</h3>
                <p className="text-xs text-emerald-600/80 mt-0.5">Đã gửi kết quả cho SV</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          {/* THANH BỘ LỌC & TÌM KIẾM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={requestSearch}
                  onChange={(e) => {
                    setRequestSearch(e.target.value);
                    setRequestPage(1);
                  }}
                  placeholder="Tìm theo MSSV, Họ tên sinh viên, Tiêu đề hoặc Nội dung..."
                  className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                />
                {requestSearch && (
                  <button
                    type="button"
                    onClick={() => setRequestSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Phân loại Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                  <Filter size={13} /> Loại:
                </span>
                <select
                  value={requestTypeFilter}
                  onChange={(e) => {
                    setRequestTypeFilter(e.target.value);
                    setRequestPage(1);
                  }}
                  className="text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                >
                  <option value="all">Tất cả phân loại</option>
                  <option value="sai_thong_tin">Sai lệch thông tin</option>
                  <option value="khong_thay_hoc_phan">Không thấy học phần</option>
                  <option value="loi_lam_bai">Lỗi kỹ thuật khi làm bài</option>
                  <option value="gop_y">Góp ý</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
            </div>

            {/* Status pills selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1">Trạng thái:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pending', label: 'Chờ tiếp nhận' },
                { id: 'in_progress', label: 'Đang xử lý' },
                { id: 'resolved', label: 'Đã giải quyết' },
                { id: 'closed', label: 'Đã đóng' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setRequestStatusFilter(st.id);
                    setRequestPage(1);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    requestStatusFilter === st.id
                      ? 'bg-[#002060] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* DANH SÁCH YÊU CẦU HỖ TRỢ (TABLE & CARD HYBRID) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm md:text-base">Hộp thư hỗ trợ sinh viên</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {requests.length} yêu cầu
                </span>
              </div>
              <span className="text-xs text-slate-400">Hiển thị yêu cầu mới nhất trước</span>
            </div>

            {loadingRequests ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-[#002060]" />
                <p className="text-sm">Đang nạp dữ liệu phản ánh từ sinh viên...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm md:text-base">Không có yêu cầu hỗ trợ nào phù hợp</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Hiện tại không có khiếu nại hay yêu cầu nào cần xử lý trong bộ lọc đã chọn.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm text-slate-600">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Sinh viên yêu cầu</th>
                      <th className="py-3 px-4">Phân loại và Tiêu đề</th>
                      <th className="py-3 px-4">Thời gian gửi</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      {/* <th className="py-3 px-4">Phản hồi của Admin</th> */}
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedRequests.map((req) => {
                      const studentCode = req.student_code || req.student_email?.split('@')[0] || '---';
                      const studentName = req.student_name || 'Sinh viên TVU';
                      const initials = studentName
                        .split(' ')
                        .map((w) => w[0])
                        .slice(-2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr key={req.request_id} className="hover:bg-slate-50/60 transition group">
                          {/* STT */}
                          <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs">
                            {`#REQ-${req.request_id}`}
                          </td>

                          {/* Sinh viên */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {/* <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#002060] to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                {initials}
                              </div> */}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{studentName}</p>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                  <span className="font-mono font-medium text-[#002060]">{studentCode}</span>
                                  {req.student_class && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[120px]">{req.student_class}</span>
                                    </>
                                  )}
                                </div>
                                {req.student_email && (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                    <span className="truncate max-w-[150px]">{req.student_email}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyEmail(req.student_email)}
                                      title="Sao chép email"
                                      className="hover:text-slate-600 p-0.5"
                                    >
                                      {copiedEmail === req.student_email ? (
                                        <Check size={11} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={11} />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phân loại & Tiêu đề */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {renderRequestType(req.request_type)}
                                <span className="font-mono text-[11px] text-slate-400"></span>
                              </div>
                              <p className="font-semibold text-slate-900 line-clamp-1">
                                {req.subject || 'Không có tiêu đề'}
                              </p>
                              {/* <p className="text-xs text-slate-500 line-clamp-2">
                                {req.content_contact_request}
                              </p> */}
                            </div>
                          </td>

                          {/* Thời gian */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs">
                            <div className="text-slate-700 font-medium">{formatDateTime(req.created_contact_request)}</div>
                            {req.resolved_contact_request && (
                              <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                 Đã xong {formatDateTime(req.resolved_contact_request)}
                              </div>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {renderRequestStatus(req.status_contact_request)}
                          </td>

                          {/* Phản hồi từ Admin */}
                          {/* <td className="py-3 px-4 max-w-[220px]">
                            {req.admin_note ? (
                              <div className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                                <div className="flex items-center gap-1 font-semibold text-emerald-800 text-[11px] mb-0.5">
                                  <Check size={12} /> Đã phản hồi:
                                </div>
                                <p className="line-clamp-2 italic">{req.admin_note}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa gửi phản hồi</span>
                            )}
                          </td> */}

                          {/* Thao tác */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenReplyModal(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#002060] text-white hover:bg-[#002060]/90 rounded-lg text-xs font-medium transition shadow-sm"
                                title="Xem và gửi phản hồi"
                              >
                                <MessageSquare size={13} />
                                <span>Phản hồi</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(req.request_id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Xóa yêu cầu"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loadingRequests && requests.length > 0 && (
              <PaginationControls
                page={currentRequestPage}
                pageSize={requestPageSize}
                totalRecords={requests.length}
                itemLabel="yêu cầu hỗ trợ"
                onPageChange={setRequestPage}
                onPageSizeChange={(size) => {
                  setRequestPageSize(size);
                  setRequestPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: QUẢN LÝ THÔNG BÁO HỆ THỐNG ======================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Lọc & Tìm kiếm Thông báo */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => {
                  setNotifSearch(e.target.value);
                  setNotifPage(1);
                }}
                placeholder="Tìm tiêu đề hoặc nội dung thông báo..."
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
              />
            </div>

            {/* Bộ lọc loại thông báo */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Phân loại:</span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'survey', label: 'Khảo sát' },
                { id: 'deadline', label: 'Hạn chót' },
                { id: 'support', label: 'Hỗ trợ' },
                { id: 'general', label: 'Chung' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setNotifTypeFilter(tab.id);
                    setNotifPage(1);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    notifTypeFilter === tab.id
                      ? 'bg-[#002060] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* GRID DANH SÁCH THÔNG BÁO */}
          {loadingNotifs ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-[#002060]" />
              <p className="text-sm">Đang tải danh sách thông báo hệ thống...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
              <Bell size={32} className="mx-auto mb-3 text-slate-300" />
              <h4 className="font-semibold text-slate-800 text-sm md:text-base">Không tìm thấy thông báo nào</h4>
              <p className="text-xs text-slate-400 mt-1">
                Hãy nhấn &quot;Tạo thông báo mới&quot; để phát tin tức tới sinh viên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedNotifications.map((notif) => {
                const typeConf = NOTIF_TYPE_CONFIG[notif.notification_type] || NOTIF_TYPE_CONFIG.general;
                const IconComp = typeConf.icon;

                return (
                  <div
                    key={notif.notification_id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Top row */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConf.iconColor}`}>
                          <IconComp size={20} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConf.badge}`}>
                            {typeConf.label}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-[#002060] transition mb-2">
                        {notif.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {notif.content_notification}
                      </p>
                    </div>

                    {/* Bottom row */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{formatDateTime(notif.created_notification)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenNotifModal(notif)}
                          className="p-1.5 text-slate-400 hover:text-[#002060] hover:bg-slate-100 rounded-lg transition"
                          title="Chỉnh sửa thông báo"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotif(notif.notification_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa thông báo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Target tag */}
                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Đối tượng:</span>
                      <span className="font-medium text-slate-600">
                        {notif.user_id ? `Sinh viên ID: #${notif.user_id}` : 'Toàn thể sinh viên (Toàn trường)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loadingNotifs && filteredNotifications.length > 0 && (
            <PaginationControls
              page={currentNotifPage}
              pageSize={notifPageSize}
              totalRecords={filteredNotifications.length}
              itemLabel="thông báo"
              onPageChange={setNotifPage}
              onPageSizeChange={(size) => {
                setNotifPageSize(size);
                setNotifPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ======================= MODAL XỬ LÝ & PHẢN HỒI YÊU CẦU ======================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#002060] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">Xử lý & Phản hồi yêu cầu hỗ trợ</h3>
                  <p className="text-xs text-white/80">#REQ-{selectedRequest.request_id} • Sinh viên TVU</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Thông tin sinh viên gửi */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-[#002060]" />
                    <span className="text-sm font-bold text-slate-900">
                      {selectedRequest.student_name || 'Sinh viên TVU'}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                      MSSV: {selectedRequest.student_code || selectedRequest.student_email?.split('@')[0]}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Gửi lúc: {formatDateTime(selectedRequest.created_contact_request)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400">Email:</span>{' '}
                    <span className="font-medium text-slate-800">{selectedRequest.student_email || '---'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lớp sinh viên:</span>{' '}
                    <span className="font-medium text-slate-800">{selectedRequest.student_class || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Nội dung phản ánh của sinh viên */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-amber-500" />
                    Vấn đề sinh viên phản ánh
                  </label>
                  {renderRequestType(selectedRequest.request_type)}
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                  <p className="font-bold text-slate-900 text-sm">{selectedRequest.subject || 'Không có tiêu đề'}</p>
                  <p className="text-xs md:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.content_contact_request}
                  </p>
                </div>
              </div>

              {/* Form phản hồi của Quản trị viên */}
              <form id="replyForm" onSubmit={handleSaveReply} className="space-y-4 pt-2 border-t border-slate-100">
                {/* Chọn trạng thái mới */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Cập nhật trạng thái xử lý <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'pending', label: 'Chờ tiếp nhận', color: 'border-amber-300 peer-checked:bg-amber-500 peer-checked:text-white' },
                      { id: 'in_progress', label: 'Đang xử lý', color: 'border-blue-300 peer-checked:bg-blue-600 peer-checked:text-white' },
                      { id: 'resolved', label: 'Đã giải quyết', color: 'border-emerald-300 peer-checked:bg-emerald-600 peer-checked:text-white' },
                      { id: 'closed', label: 'Đóng yêu cầu', color: 'border-slate-300 peer-checked:bg-slate-700 peer-checked:text-white' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`cursor-pointer border rounded-xl p-2.5 text-center text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                          replyForm.status === opt.id
                            ? 'bg-[#002060] text-white border-[#002060] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="replyStatus"
                          value={opt.id}
                          checked={replyForm.status === opt.id}
                          onChange={(e) => setReplyForm({ ...replyForm, status: e.target.value })}
                          className="sr-only"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

            

                {/* Nội dung phản hồi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nội dung phản hồi gửi sinh viên <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={replyForm.admin_note}
                    onChange={(e) => setReplyForm({ ...replyForm, admin_note: e.target.value })}
                    placeholder="Nhập nội dung giải đáp, hướng dẫn sinh viên hoặc kết quả xử lý..."
                    className="w-full p-3 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                  />
                  
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="replyForm"
                disabled={submittingReply}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-semibold text-white bg-[#002060] hover:bg-[#002060]/90 rounded-xl transition shadow-sm disabled:opacity-60"
              >
                {submittingReply ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Lưu & Gửi phản hồi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL TẠO / SỬA THÔNG BÁO ======================= */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Header */}
            <div className="px-6 py-4 bg-[#002060] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <h3 className="font-bold text-base md:text-lg">
                  {editingNotif ? 'Chỉnh sửa Thông báo hệ thống' : 'Phát hành Thông báo mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form id="notifForm" onSubmit={handleSaveNotif} className="p-6 overflow-y-auto space-y-4">
              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  placeholder="Ví dụ: Thông báo mở đợt khảo sát ý kiến sinh viên HK II..."
                  className="w-full px-3.5 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                />
              </div>

              {/* Loại thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Loại thông báo <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'survey', label: 'Khảo sát' },
                    { id: 'deadline', label: 'Hạn chót' },
                    { id: 'support', label: 'Hỗ trợ' },
                    { id: 'general', label: 'Chung' },
                  ].map((t) => (
                    <label
                      key={t.id}
                      className={`cursor-pointer border rounded-xl p-2.5 text-center text-xs font-semibold transition ${
                        notifForm.notification_type === t.id
                          ? 'bg-[#002060] text-white border-[#002060] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="notifType"
                        value={t.id}
                        checked={notifForm.notification_type === t.id}
                        onChange={(e) => setNotifForm({ ...notifForm, notification_type: e.target.value })}
                        className="sr-only"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Đối tượng nhận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đối tượng nhận
                </label>
                <input
                  type="text"
                  value={notifForm.user_id}
                  onChange={(e) => setNotifForm({ ...notifForm, user_id: e.target.value })}
                  placeholder="Để trống để phát tới TOÀN TRƯỜNG, hoặc nhập ID tài khoản cụ thể..."
                  className="w-full px-3.5 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                />
                
              </div>

              {/* Nội dung thông báo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội dung chi tiết thông báo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={notifForm.content_notification}
                  onChange={(e) => setNotifForm({ ...notifForm, content_notification: e.target.value })}
                  placeholder="Soạn nội dung thông báo gửi đến sinh viên..."
                  className="w-full p-3 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="px-4 py-2 text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="notifForm"
                disabled={submittingNotif}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-semibold text-white bg-[#002060] hover:bg-[#002060]/90 rounded-xl transition shadow-sm disabled:opacity-60"
              >
                {submittingNotif ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{editingNotif ? 'Lưu cập nhật' : 'Phát hành thông báo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportRequestPage;
