import { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  ArrowRight,
  ArrowLeft,
  Download,
  RefreshCw,
  Search,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

// Danh sách 4 bước quy trình nghiệp vụ nhập dữ liệu
const STEPS = [
  { step: 1, title: 'BƯỚC 1', subtitle: 'Tải lên tệp dữ liệu' },
  { step: 2, title: 'BƯỚC 2 (HIỆN TẠI)', subtitle: 'Kiểm tra tệp đã chọn' },
  { step: 3, title: 'BƯỚC 3', subtitle: 'Gửi tệp và nhập dữ liệu' },
  { step: 4, title: 'BƯỚC 4', subtitle: 'Kết quả xử lý' },
];

export default function EnrollmentImportPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [records] = useState([]);

  // Bộ lọc và phân trang được giữ cho bảng xem trước khi có dữ liệu thực.
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // State Modal Lịch sử nhập & Kết quả
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  // Tự ẩn toast sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tải lịch sử các đợt import
  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const res = await axiosClient.get('/admin/import/batches?limit=50');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setBatches(list);
    } catch (err) {
      console.error('Lỗi tải lịch sử import:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tải lịch sử nhập dữ liệu.',
      });
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
    fetchBatches();
  };

  // Xử lý kéo thả chọn file
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setToast({
        type: 'error',
        message: 'Định dạng tệp không được hỗ trợ! Vui lòng chọn tệp .xlsx, .xls hoặc .csv.',
      });
      return;
    }

    setRawFile(selectedFile);
    const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
    setFile({
      name: selectedFile.name,
      size: `${sizeMB} MB`,
      selectedAt: new Date().toLocaleString('vi-VN'),
    });
    setImportResult(null);
    setCurrentStep(2);
    setToast({
      type: 'success',
      message: `Đã chọn tệp ${selectedFile.name}. Dữ liệu sẽ được kiểm tra trên máy chủ khi xác nhận.`,
    });
  };

  // Tải tệp mẫu CSV đăng ký học phần
  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'student_id,section_id\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_DangKy_HocPhan_DBCL_TVU.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'Đã tải tệp mẫu định dạng ĐBCL TVU thành công!' });
  };

  // Xuất danh sách lỗi thực tế do backend trả về
  const handleExportErrors = () => {
    const errorRecords = importResult?.errorDetails || [];
    if (errorRecords.length === 0) {
      setToast({ type: 'success', message: 'Không có dòng dữ liệu lỗi nào!' });
      return;
    }

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Dòng', 'MSSV', 'Chi tiết lỗi'];
    const rows = errorRecords.map((error) => [
      error.row,
      escapeCsv(error.student_code),
      escapeCsv(error.detail),
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) => `${row[0]},${row[1]},${row[2]}`),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Loi_DangKy_${file?.name || 'import'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'Đã tải danh sách báo cáo lỗi đối soát.' });
  };

  // Xác nhận nhập dữ liệu thực tế lên Backend API
  const handleConfirmImport = async () => {
    if (!rawFile) {
      setToast({ type: 'error', message: 'Vui lòng chọn tệp dữ liệu trước khi nhập.' });
      return;
    }
    setImporting(true);
    setCurrentStep(3);
    try {
      const formData = new FormData();
      formData.append('file', rawFile);

      const res = await axiosClient.post('/admin/import/enrollments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCurrentStep(4);
      setImportResult({
        total: res.total_rows,
        valid: res.valid_rows,
        errors: res.error_rows,
        errorDetails: res.errors || [],
      });
      setToast({
        type: 'success',
        message: `Đã xử lý tệp: ghi nhận ${res.valid_rows} dòng hợp lệ, ${res.error_rows} dòng lỗi.`,
      });
    } catch (err) {
      console.error('Lỗi nạp file:', err);
      setCurrentStep(2);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể đồng bộ tệp vào cơ sở dữ liệu.',
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (!searchKeyword.trim()) return true;

      const keyword = searchKeyword.toLowerCase().trim();
      return (
        record.mssv.toLowerCase().includes(keyword) ||
        record.hoTen.toLowerCase().includes(keyword) ||
        record.maLopHp.toLowerCase().includes(keyword) ||
        record.tenMonHoc.toLowerCase().includes(keyword)
      );
    });
  }, [records, statusFilter, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. HEADER KHỐI TIÊU ĐỀ & TRẠNG THÁI CỔNG ĐBCL */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
                Nhập dữ liệu đăng ký học phần
              </h1>
            </div>
            
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenHistory}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <History size={14} />
              <span>Xem lịch sử nhập dữ liệu</span>
            </button>
          </div>
        </div>

        {/* THANH 4 BƯỚC TIẾN TRÌNH NGHIỆP VỤ (STEPPER) */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 pt-4 border-t border-slate-100">
          {STEPS.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <div
                key={s.step}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${
                  isCurrent
                    ? 'border-[#002060] bg-[#002060] text-white shadow-md'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : s.step}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isCurrent ? 'text-amber-300' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="truncate text-xs font-bold leading-tight">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
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
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
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
      {/* NỘI DUNG BƯỚC 1: KHỐI KÉO THẢ TẢI LÊN TỆP */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80 text-center space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
                : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-[#002060]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
              className="hidden"
            />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-[#002060] mb-4 shadow-sm">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Kéo thả tệp dữ liệu vào đây hoặc nhấn để chọn tệp
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Hỗ trợ định dạng Microsoft Excel (.xlsx, .xls) hoặc CSV chuẩn UTF-8
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
            >
              <Download size={14} />
              <span>Tải tệp mẫu tại đây</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Lưu ý: Mỗi học kỳ chỉ có duy nhất một đợt nhập dữ liệu đăng ký
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* NỘI DUNG BƯỚC 2: KIỂM TRA TỆP ĐÃ CHỌN */}
      {/* ============================================================== */}
      {currentStep === 2 && file && (
        <>
          {/* KHỐI THÔNG TIN TỆP DỮ LIỆU ĐÃ TIẾP NHẬN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-[#002060]" />
                <h2 className="text-sm font-extrabold text-slate-900">
                  Tệp đã chọn
                </h2>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                <Download size={14} />
                <span>Tải tệp mẫu CSV ĐBCL</span>
              </button>
            </div>

            {/* THẺ TỆP EXCEL */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200">
                  <FileSpreadsheet size={26} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{file.name}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      Chờ máy chủ kiểm tra
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Dung lượng: <strong>{file.size}</strong></span>
                    <span>•</span>
                    <span>Thời gian chọn: <strong>{file.selectedAt}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRawFile(null);
                  setFile(null);
                  setImportResult(null);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <RotateCcw size={14} />
                <span>Thay thế tệp khác</span>
              </button>
            </div>

            {/* HỘP QUY ĐỊNH ĐBCL TVU */}
            {/* <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
              <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Quy định ĐBCL TVU:</strong> Quan hệ sinh viên - Lớp học phần được ghi nhận chính xác theo đăng ký học thực tế (bao gồm học ghép, học vượt, cải thiện điểm), hoàn toàn độc lập với Lớp quản trị hành chính.
              </p>
            </div>
            <p className="text-xs text-slate-600">
              Học kỳ, học phần và giảng viên được lấy tự động từ dữ liệu lớp học phần đã có.
            </p> */}
          </div>

          {/* ============================================================== */}
          {/* BẢNG ĐỐI SOÁT CHI TIẾT TỪNG DÒNG (PREVIEW TABLE) */}
          {/* ============================================================== */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm space-y-4 p-4">
            {records.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Tệp chưa được phân tích ở trình duyệt. Sau khi xác nhận, máy chủ sẽ tra cứu sinh viên,
                lớp học phần và trả về số liệu cùng các dòng lỗi.
              </p>
            ) : (
              <>
            {/* THANH LỌC TAB VÀ TÌM KIẾM DÒNG */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
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
                  Tất cả ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('error');
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === 'error'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Chỉ xem dòng lỗi ({records.filter((record) => record.status === 'error').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('warning');
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === 'warning'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Dòng cảnh báo ({records.filter((record) => record.status === 'warning').length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('valid');
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    statusFilter === 'valid'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Hợp lệ ({records.filter((record) => record.status === 'valid').length})
                </button>
              </div>

              {/* Ô TÌM KIẾM */}
              <div className="relative min-w-[240px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo MSSV hoặc Mã LHP..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#002060] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-[#002060]">
                  <tr>
                    <th className="px-3 py-3 text-center w-12">STT</th>
                    <th className="px-3 py-3">MSSV</th>
                    <th className="px-3 py-3">Họ và tên sinh viên</th>
                    <th className="px-3 py-3">Mã lớp học phần</th>
                    <th className="px-3 py-3">Tên môn học / Mã môn</th>
                    <th className="px-3 py-3">Học kỳ</th>
                    <th className="px-3 py-3">Giảng viên phụ trách</th>
                    <th className="px-3 py-3 text-center">Trạng thái</th>
                    <th className="px-3 py-3">Chi tiết lỗi / Ghi chú đối soát</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        Chưa có dữ liệu xem trước. Máy chủ sẽ kiểm tra tệp sau khi bạn xác nhận nhập.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r, idx) => {
                      const isErr = r.status === 'error';
                      const isWarn = r.status === 'warning';
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            isErr
                              ? 'bg-rose-50/40 hover:bg-rose-50/70'
                              : isWarn
                              ? 'bg-amber-50/30 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-3 py-3 text-center font-bold text-slate-400">
                            {rowNum}
                          </td>

                          {/* MSSV */}
                          <td className="px-3 py-3 font-bold text-slate-800">
                            {r.mssv ? (
                              r.mssv
                            ) : (
                              <span className="inline-flex rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                [Trống MSSV]
                              </span>
                            )}
                          </td>

                          {/* HỌ VÀ TÊN */}
                          <td className="px-3 py-3 font-semibold text-slate-900">
                            {r.hoTen}
                          </td>

                          {/* MÃ LỚP HỌC PHẦN */}
                          <td className="px-3 py-3 font-mono">
                            {r.maLopHp === 'LHP_KHONG_TON_TAI' ? (
                              <span className="inline-flex rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                [LHP_KHÔNG_TỒN_TẠI]
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                                {r.maLopHp}
                              </span>
                            )}
                          </td>

                          {/* TÊN MÔN HỌC */}
                          <td className="px-3 py-3">
                            <p className="font-semibold text-slate-800 leading-tight">
                              {r.tenMonHoc}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {r.maMon}
                            </p>
                          </td>

                          {/* HỌC KỲ */}
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                            {r.hocKy}
                          </td>

                          {/* GIẢNG VIÊN */}
                          <td className="px-3 py-3 text-slate-700 whitespace-nowrap">
                            {r.giangVien}
                          </td>

                          {/* TRẠNG THÁI */}
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            {r.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <Check size={12} /> Hợp lệ
                              </span>
                            )}
                            {r.status === 'warning' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                <AlertTriangle size={12} /> Cảnh báo
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                <XCircle size={12} /> Lỗi dữ liệu
                              </span>
                            )}
                          </td>

                          {/* GHI CHÚ ĐỐI SOÁT */}
                          <td className="px-3 py-3 text-xs">
                            <span
                              className={`font-medium ${
                                isErr
                                  ? 'text-rose-600 font-bold'
                                  : isWarn
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {r.note}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PHÂN TRANG */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
              <p>
                Hiển thị{' '}
                <strong className="text-slate-800">
                  {filteredRecords.length === 0
                    ? '0'
                    : `${(currentPage - 1) * pageSize + 1} – ${Math.min(
                        currentPage * pageSize,
                        filteredRecords.length
                      )}`}
                </strong>{' '}
                trên tổng số <strong className="text-slate-800">{filteredRecords.length}</strong> dòng đã kiểm tra
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
                        ? 'bg-[#002060] text-white'
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
              </>
            )}
          </div>

          {/* ============================================================== */}
          {/* THANH ĐIỀU HƯỚNG DƯỚI ĐÁY TRANG (BOTTOM ACTION BAR) */}
          {/* ============================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRawFile(null);
                  setFile(null);
                  setImportResult(null);
                  setCurrentStep(1);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowLeft size={15} />
                <span>Quay lại / Tải tệp khác</span>
              </button>

            </div>

            <button
              type="button"
              disabled={importing}
              onClick={handleConfirmImport}
              className="flex items-center gap-2 rounded-xl bg-[#002060] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#001748] transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Đang xử lý đồng bộ...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận gửi tệp lên máy chủ để kiểm tra và nhập dữ liệu</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200/80">
          <RefreshCw size={32} className="mx-auto animate-spin text-[#002060]" />
          <p className="mt-4 text-sm font-bold text-slate-900">
            {importing
              ? 'Máy chủ đang kiểm tra và nhập dữ liệu...'
              : 'Đang chờ kết quả từ máy chủ...'}
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* NỘI DUNG BƯỚC 4: KẾT QUẢ THỰC TẾ TỪ BACKEND */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200/80 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Đã xử lý tệp đăng ký học phần
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Kết quả dưới đây được trả về từ máy chủ sau khi đối chiếu dữ liệu.
            </p>
          </div>

          <div className="mx-auto max-w-lg grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Tổng số dòng</span>
              <span className="text-2xl font-black text-slate-900">
                {importResult?.total?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">Đã ghi nhận</span>
              <span className="text-2xl font-black text-emerald-700">
                {importResult?.valid?.toLocaleString() ?? '—'}
              </span>
            </div>
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-200">
              <span className="text-[11px] text-rose-700 block">Bỏ qua do lỗi</span>
              <span className="text-2xl font-black text-rose-700">
                {importResult?.errors ?? '—'}
              </span>
            </div>
          </div>

          {importResult?.errorDetails?.length > 0 && (
            <div className="mx-auto max-w-4xl overflow-x-auto rounded-xl border border-rose-200 text-left">
              <table className="w-full text-xs text-slate-700">
                <thead className="bg-rose-50 text-rose-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Dòng</th>
                    <th className="px-3 py-2 text-left">MSSV</th>
                    <th className="px-3 py-2 text-left">Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {importResult.errorDetails.map((error, index) => (
                    <tr key={`${error.row}-${index}`}>
                      <td className="px-3 py-2">{error.row}</td>
                      <td className="px-3 py-2">{error.student_code}</td>
                      <td className="px-3 py-2">{error.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            {importResult?.errorDetails?.length > 0 && (
              <button
                type="button"
                onClick={handleExportErrors}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <Download size={15} />
                <span>Tải danh sách lỗi CSV</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenHistory}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <History size={15} />
              <span>Xem lịch sử nhập dữ liệu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRawFile(null);
                setFile(null);
                setImportResult(null);
                setCurrentStep(1);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#002060] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#001748] transition"
            >
              <UploadCloud size={15} />
              <span>Nhập đợt tệp khác</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL LỊCH SỬ CÁC ĐỢT IMPORT (IMPORT BATCHES) */}
      {/* ============================================================== */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <History size={18} />
                Lịch sử các đợt nhập dữ liệu đăng ký học phần
              </h3>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {loadingBatches ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#002060]" />
                  <span>Đang tải lịch sử các đợt import...</span>
                </div>
              ) : batches.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  Chưa có đợt nhập dữ liệu nào được lưu trong hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Mã đợt</th>
                        <th className="px-3 py-2.5">Tên tệp</th>
                        <th className="px-3 py-2.5">Thời gian tải</th>
                        <th className="px-3 py-2.5 text-right">Tổng dòng</th>
                        <th className="px-3 py-2.5 text-right">Hợp lệ</th>
                        <th className="px-3 py-2.5 text-right">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batches.map((b) => (
                        <tr key={b.import_batch_id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-bold text-[#002060]">
                            #{b.import_batch_id}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {b.file_name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {b.uploaded_import_batch
                              ? new Date(b.uploaded_import_batch).toLocaleString('vi-VN')
                              : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                            {b.total_rows.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                            {b.valid_rows.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-rose-600">
                            {b.error_rows}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
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
