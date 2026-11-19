import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Ticket,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const REQUEST_TYPE_LABELS = {
  sai_thong_tin: 'Sai lệch thông tin',
  khong_thay_hoc_phan: 'Không thấy học phần',
  loi_lam_bai: 'Lỗi kỹ thuật khi làm khảo sát',
  gop_y: 'Góp ý',
  khac: 'Khác',
};

const REQUEST_STATUS = {
  pending: {
    label: 'Đã tiếp nhận',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  in_progress: {
    label: 'Đang xử lý',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  resolved: {
    label: 'Đã xử lý',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  closed: {
    label: 'Đã đóng',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa cập nhật' : date.toLocaleString('vi-VN');
};

const getErrorMessage = (error) =>
  error.response?.data?.detail || error.message || 'Đã xảy ra lỗi, vui lòng thử lại.';

const TICKETS_PER_PAGE = 3;

const loadMyTickets = async () => {
  const response = await axiosClient.get('/student/contact/my-requests');
  const requests = response?.data || response;
  if (!Array.isArray(requests)) {
    throw new Error('Dữ liệu yêu cầu hỗ trợ trả về không hợp lệ.');
  }

  return requests.map((item) => {
    const status = REQUEST_STATUS[item.status_contact_request] || REQUEST_STATUS.pending;
    return {
      ticket_id: item.request_id,
      subject: item.subject || 'Yêu cầu hỗ trợ',
      category: REQUEST_TYPE_LABELS[item.request_type] || item.request_type || 'Khác',
      created_at: formatDateTime(item.created_contact_request),
      status: item.status_contact_request,
      status_label: status.label,
      status_color: status.color,
      content: item.content_contact_request || '',
      response_content: item.admin_note || 'Chưa có nội dung phản hồi từ quản trị viên.',
      resolved_at: item.resolved_contact_request,
    };
  });
};

export default function StudentSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentTicketPage, setCurrentTicketPage] = useState(1);

  const fetchMyTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError('');
    setCurrentTicketPage(1);
    try {
      setTickets(await loadMyTickets());
    } catch (error) {
      setTicketsError(getErrorMessage(error));
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const totalTicketPages = Math.max(1, Math.ceil(tickets.length / TICKETS_PER_PAGE));
  const visibleTickets = tickets.slice(
    (currentTicketPage - 1) * TICKETS_PER_PAGE,
    currentTicketPage * TICKETS_PER_PAGE
  );

  useEffect(() => {
    let active = true;
    loadMyTickets()
      .then((requests) => {
        if (active) {
          setTickets(requests);
          setTicketsError('');
          setCurrentTicketPage(1);
        }
      })
      .catch((error) => {
        if (active) setTicketsError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setTicketsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Xóa form làm lại
  const handleResetForm = () => {
    setSelectedCategory('');
    setTitle('');
    setContent('');
    setIsConfirmed(false);
  };

  // Gửi yêu cầu hỗ trợ mới
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showToast('❌ Vui lòng chọn chủ đề cần hỗ trợ!', true);
      return;
    }
    if (!title.trim()) {
      showToast('❌ Vui lòng nhập tiêu đề yêu cầu!', true);
      return;
    }
    if (content.trim().length < 20) {
      showToast('❌ Nội dung chi tiết phải có tối thiểu 20 ký tự!', true);
      return;
    }
    if (!isConfirmed) {
      showToast('❌ Vui lòng tích chọn xác nhận thông tin phản ánh!', true);
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/student/contact/', {
        request_type: selectedCategory,
        subject: title,
        content_contact_request: content,
      });
      showToast('Gửi yêu cầu hỗ trợ thành công. Yêu cầu đã được lưu vào hệ thống.');
      handleResetForm();
      await fetchMyTickets();
    } catch (error) {
      showToast(getErrorMessage(error), true);
    } finally {
      setSubmitting(false);
    }
  };

  const showToast = (message, isError = false) => {
    setToastMessage({ message, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* THÔNG BÁO TOAST NỔI */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg animate-bounce ${
            toastMessage.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* 1. BANNER CHÍNH KHỐI XANH NAVY (#08245f) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#08245f] p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="mx-auto w-full max-w-3xl space-y-2 text-center">
            {/* HUY HIỆU KÊNH TIẾP NHẬN CHÍNH THỨC */}
            

            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Trung tâm Hỗ trợ và Giải đáp Sinh viên TVU
            </h1>
            <p className="text-xs text-blue-100/90 sm:text-sm leading-relaxed">
              Gửi thắc mắc về kỹ thuật khảo sát, thông tin học phần hoặc các góp ý. Bạn có thể theo dõi trạng thái và phản hồi của quản trị viên trong lịch sử yêu cầu.
            </p>
          </div>

          
        </div>

        {/* 3 THẺ LIÊN HỆ DƯỚI CÙNG BANNER */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Card 1: Theo dõi yêu cầu */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-emerald-300">
              <Ticket size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                MÃ YÊU CẦU
              </p>
              <p className="text-sm font-extrabold text-white">Được tạo tự động</p>
              <p className="text-[10px] text-blue-200">Hiển thị trong lịch sử hỗ trợ</p>
            </div>
          </div>

          {/* Card 2: Phản hồi */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                PHẢN HỒI
              </p>
              <p className="text-sm font-extrabold text-white">Theo từng yêu cầu</p>
              <p className="text-[10px] text-blue-200">Hiển thị khi có phản hồi</p>
            </div>
          </div>

          {/* Card 3: Thời gian */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-amber-300">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                THỜI GIAN GỬI
              </p>
              <p className="text-xs font-bold text-white">Ghi nhận tự động</p>
              <p className="text-[10px] text-blue-200">Theo thời gian trên hệ thống</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BỐ CỤC 2 CỘT: FORM GỬI YÊU CẦU & LỊCH SỬ TICKET */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI (7 PHẦN): FORM GỬI YÊU CẦU HỖ TRỢ */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs lg:col-span-7 flex flex-col justify-between">
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            {/* HEADER FORM */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
                  <HelpCircle size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Gửi yêu cầu hỗ trợ mới
                </h2>
              </div>
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                * Trường bắt buộc
              </span>
            </div>

            {/* TRƯỜNG 1: CHỦ ĐỀ CẦN HỖ TRỢ */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Chủ đề cần hỗ trợ *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Chọn phân loại hỗ trợ --</option>
                <option value="sai_thong_tin">Sai lệch thông tin học phần / giảng viên</option>
                <option value="khong_thay_hoc_phan">Không thấy học phần</option>
                <option value="loi_lam_bai">Lỗi kỹ thuật khi làm khảo sát</option>
                <option value="gop_y">Góp ý</option>
                <option value="khac">Vấn đề khác</option>
              </select>
            </div>

            {/* TRƯỜNG 2: TIÊU ĐỀ YÊU CẦU */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Tiêu đề yêu cầu *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Không thể bấm nút gửi khảo sát môn Lập trình Web"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* TRƯỜNG 3: NỘI DUNG CHI TIẾT */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">Nội dung chi tiết *</label>
                <span className="text-[11px] text-slate-400">Tối thiểu 20 ký tự</span>
              </div>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả chi tiết sự cố bạn gặp phải, thời gian xảy ra, thiết bị hoặc trình duyệt đang sử dụng (Chrome, Safari, điện thoại hay laptop)..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {/* TÍCH CHỌN XÁC NHẬN */}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:bg-slate-50">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#08245f]"
              />
              <span className="text-[11px] leading-relaxed text-slate-600">
                Tôi xác nhận thông tin phản ánh là chính xác và phục vụ mục đích nâng cao chất lượng đào tạo của Trường Đại học Trà Vinh. Tôi hiểu rằng mọi ý kiến đóng góp đều được bảo mật theo quy định khảo sát nội bộ.
              </span>
            </label>

            {/* NÚT THAO TÁC FORM */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Xóa làm lại
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0b3387] transition"
              >
                <Send size={13} />
                <span>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI (5 PHẦN): YÊU CẦU HỖ TRỢ GẦN ĐÂY (TICKETS) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            {/* HEADER KHỐI TICKET */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-[#08245f]" />
                <h2 className="text-sm font-bold text-slate-900">
                  Yêu cầu hỗ trợ gần đây của bạn
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                {tickets.length} ticket
              </span>
            </div>

            {/* DANH SÁCH TICKETS */}
            <div className="mt-4 space-y-3">
              {ticketsLoading && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Đang tải yêu cầu hỗ trợ...
                </div>
              )}

              {!ticketsLoading && ticketsError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <p>{ticketsError}</p>
                  <button
                    type="button"
                    onClick={fetchMyTickets}
                    className="mt-2 font-semibold underline"
                  >
                    Thử tải lại
                  </button>
                </div>
              )}

              {!ticketsLoading && !ticketsError && visibleTickets.map((t) => (
                <div
                  key={t.ticket_id}
                  onClick={() => setSelectedTicket(t)}
                  className="group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-3.5 transition hover:border-blue-400 hover:shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      #{t.ticket_id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${t.status_color}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {t.status_label}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-[#08245f] transition line-clamp-2">
                    {t.subject}
                  </h3>
                  <p className="text-[11px] text-slate-500">{t.category}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{t.created_at}</span>
                    <span className="font-medium text-slate-600">Xem chi tiết</span>
                  </div>
                </div>
              ))}

              {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Bạn chưa gửi yêu cầu hỗ trợ nào.
                </div>
              )}
            </div>

            {!ticketsLoading && !ticketsError && tickets.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-500">
                  Trang {currentTicketPage}/{totalTicketPages} · {tickets.length} yêu cầu
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentTicketPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentTicketPage === 1}
                    aria-label="Trang trước"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentTicketPage((page) =>
                        Math.min(totalTicketPages, page + 1)
                      )
                    }
                    disabled={currentTicketPage === totalTicketPages}
                    aria-label="Trang sau"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* NÚT XEM TẤT CẢ LỊCH SỬ DƯỚI CÙNG */}
          <button
            type="button"
            onClick={fetchMyTickets}
            disabled={ticketsLoading}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1"
          >
            <span>{ticketsLoading ? 'Đang tải...' : `Làm mới lịch sử yêu cầu (${tickets.length})`}</span>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL CHI TIẾT TICKET KHI BẤM VÀO */}
      {/* ============================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#08245f]">
                  #{selectedTicket.ticket_id}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${selectedTicket.status_color}`}
                >
                  {selectedTicket.status_label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tiêu đề yêu cầu:</p>
                <p className="text-sm font-bold text-slate-800">{selectedTicket.subject}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Chủ đề hỗ trợ:</p>
                <p className="text-slate-700">{selectedTicket.category}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Ngày gửi:</p>
                <p className="text-slate-700">{selectedTicket.created_at}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">Nội dung sinh viên phản ánh:</p>
                <p className="text-slate-700 leading-relaxed">{selectedTicket.content}</p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#08245f]">Phản hồi từ quản trị viên</span>
                  {selectedTicket.resolved_at && (
                    <span className="text-slate-400">
                      {formatDateTime(selectedTicket.resolved_at)}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selectedTicket.response_content}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-xl bg-[#08245f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b3387]"
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
