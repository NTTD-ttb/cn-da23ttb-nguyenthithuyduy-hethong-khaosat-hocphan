import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database,
  Building2,
  GraduationCap,
  Users2,
  BookOpen,
  Layers,
  CalendarDays,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  UploadCloud,
  Download,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const IMPORT_COLUMN_HINTS = {
  lecturers: 'Mã giảng viên, Họ và tên giảng viên, Email, Số điện thoại, Mã khoa',
  courses: 'Mã học phần, Tên học phần, Mô tả',
  course_sections: 'Mã lớp học phần, Mã học phần, Mã giảng viên, Mã học kỳ',
};

const IMPORT_FILE_NAMES = {
  lecturers: {
    template: 'Mẫu_dữ_liệu_giảng_viên.xlsx',
    errors: 'Lỗi_import_giảng_viên.csv',
  },
  courses: {
    template: 'Mẫu_dữ_liệu_học_phần.xlsx',
    errors: 'Lỗi_import_học_phần.csv',
  },
  course_sections: {
    template: 'Mẫu_dữ_liệu_lớp_học_phần.xlsx',
    errors: 'Lỗi_import_lớp_học_phần.csv',
  },
};

// Danh sách 6 danh mục đào tạo
const TABS = [
  {
    id: 'faculties',
    label: 'Khoa / Đơn vị',
    icon: Building2,
    endpoint: '/admin/faculties',
    idKey: 'faculty_id',
    nameKey: 'faculty_name',
    codeKey: 'faculty_code',
    description: 'Quản lý thông tin các khoa, đơn vị đào tạo trực thuộc',
  },
  {
    id: 'student_classes',
    label: 'Lớp sinh viên',
    icon: GraduationCap,
    endpoint: '/admin/student-classes',
    idKey: 'class_id',
    nameKey: 'class_name',
    codeKey: 'class_code',
    description: 'Quản lý các lớp sinh viên chuyên ngành theo niên khóa',
  },
  {
    id: 'lecturers',
    label: 'Giảng viên',
    icon: Users2,
    endpoint: '/admin/lecturers',
    idKey: 'lecturer_id',
    nameKey: 'full_name',
    codeKey: 'lecturer_code',
    description: 'Danh sách cán bộ giảng viên giảng dạy và hướng dẫn',
  },
  {
    id: 'courses',
    label: 'Học phần',
    icon: BookOpen,
    endpoint: '/admin/courses',
    idKey: 'course_id',
    nameKey: 'course_name',
    codeKey: 'course_code',
    description: 'Danh mục các môn học và học phần trong chương trình',
  },
  {
    id: 'course_sections',
    label: 'Lớp học phần',
    icon: Layers,
    endpoint: '/admin/course-sections',
    idKey: 'section_id',
    nameKey: 'section_code',
    codeKey: 'section_code',
    description: 'Các lớp học phần mở theo từng học kỳ có giảng viên phụ trách',
  },
  {
    id: 'academic_terms',
    label: 'Học kỳ',
    icon: CalendarDays,
    endpoint: '/admin/academic-terms',
    idKey: 'term_id',
    nameKey: 'term_name',
    codeKey: 'term_code',
    description: 'Quản lý niên khóa, học kỳ chính khóa và học kỳ hè',
  },
];

export default function TrainingDataPage() {
  const [activeTabId, setActiveTabId] = useState('faculties');
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  // Dữ liệu của 6 danh mục
  const [dataMap, setDataMap] = useState({
    faculties: [],
    student_classes: [],
    lecturers: [],
    courses: [],
    course_sections: [],
    academic_terms: [],
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importFileInputRef = useRef(null);

  // State quản lý Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // State quản lý Modal Xác nhận Xóa
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    item: null,
  });
  const [deleting, setDeleting] = useState(false);

  const currentTab = useMemo(
    () => TABS.find((t) => t.id === activeTabId) || TABS[0],
    [activeTabId]
  );

  // Tự động ẩn Toast sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tải dữ liệu của danh mục hiện tại và các danh mục phụ thuộc (để điền dropdown)
  const fetchCategoryData = async (tabId) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (!tab) return;
    try {
      setLoading(true);
      const res = await axiosClient.get(`${tab.endpoint}/?limit=500`);
      const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setDataMap((prev) => ({ ...prev, [tabId]: items }));
    } catch (err) {
      console.error(`Lỗi tải dữ liệu ${tabId}:`, err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || `Không thể tải dữ liệu ${tab.label}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Tải trước dữ liệu hỗ trợ (Faculties, Courses, Lecturers, Academic Terms) để chọn trong form
  const fetchReferenceData = async () => {
    try {
      const [facultiesRes, coursesRes, lecturersRes, termsRes] = await Promise.all([
        axiosClient.get('/admin/faculties/?limit=500'),
        axiosClient.get('/admin/courses/?limit=500'),
        axiosClient.get('/admin/lecturers/?limit=500'),
        axiosClient.get('/admin/academic-terms/?limit=500'),
      ]);

      setDataMap((prev) => ({
        ...prev,
        faculties: Array.isArray(facultiesRes) ? facultiesRes : facultiesRes?.data || [],
        courses: Array.isArray(coursesRes) ? coursesRes : coursesRes?.data || [],
        lecturers: Array.isArray(lecturersRes) ? lecturersRes : lecturersRes?.data || [],
        academic_terms: Array.isArray(termsRes) ? termsRes : termsRes?.data || [],
      }));
    } catch (err) {
      console.error('Lỗi tải dữ liệu tham chiếu:', err);
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    fetchCategoryData(activeTabId);
    setSearchTerm('');
    setFacultyFilter('');
  }, [activeTabId]);

  // Lọc dữ liệu theo từ khóa tìm kiếm và bộ lọc khoa
  const filteredList = useMemo(() => {
    const list = Array.isArray(dataMap[activeTabId]) ? dataMap[activeTabId] : [];
    const term = (searchTerm || '').toLowerCase().trim();

    return list.filter((item) => {
      if (!item) return false;

      // Bộ lọc theo khoa
      if (facultyFilter && (activeTabId === 'student_classes' || activeTabId === 'lecturers')) {
        if (String(item.faculty_id) !== String(facultyFilter)) {
          return false;
        }
      }

      if (!term) return true;

      // Tìm kiếm toàn diện
      if (activeTabId === 'faculties') {
        return (
          item.faculty_code?.toLowerCase().includes(term) ||
          item.faculty_name?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
        );
      }
      if (activeTabId === 'student_classes') {
        return (
          item.class_code?.toLowerCase().includes(term) ||
          item.class_name?.toLowerCase().includes(term)
        );
      }
      if (activeTabId === 'lecturers') {
        return (
          item.lecturer_code?.toLowerCase().includes(term) ||
          item.full_name?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term)
        );
      }
      if (activeTabId === 'courses') {
        return (
          item.course_code?.toLowerCase().includes(term) ||
          item.course_name?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
        );
      }
      if (activeTabId === 'course_sections') {
        return (
          item.section_code?.toLowerCase().includes(term) ||
          item.course_name?.toLowerCase().includes(term) ||
          item.lecturer_name?.toLowerCase().includes(term) ||
          item.term_name?.toLowerCase().includes(term)
        );
      }
      if (activeTabId === 'academic_terms') {
        return (
          item.term_code?.toLowerCase().includes(term) ||
          item.term_name?.toLowerCase().includes(term) ||
          item.academic_year?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [dataMap, activeTabId, searchTerm, facultyFilter]);

  // Mở modal Thêm mới
  const handleOpenCreate = () => {
    setModalMode('create');
    if (activeTabId === 'faculties') {
      setFormData({ faculty_code: '', faculty_name: '', description: '', status: 'active' });
    } else if (activeTabId === 'student_classes') {
      const defaultFaculty = dataMap.faculties[0]?.faculty_id || '';
      setFormData({ class_code: '', class_name: '', faculty_id: defaultFaculty, status: 'active' });
    } else if (activeTabId === 'lecturers') {
      const defaultFaculty = dataMap.faculties[0]?.faculty_id || '';
      setFormData({ lecturer_code: '', full_name: '', email: '', phone: '', faculty_id: defaultFaculty });
    } else if (activeTabId === 'courses') {
      setFormData({ course_code: '', course_name: '', description: '' });
    } else if (activeTabId === 'course_sections') {
      setFormData({
        section_code: '',
        course_id: dataMap.courses[0]?.course_id || '',
        lecturer_id: dataMap.lecturers[0]?.lecturer_id || '',
        term_id: dataMap.academic_terms[0]?.term_id || '',
      });
    } else if (activeTabId === 'academic_terms') {
      setFormData({ term_code: '', term_name: '', academic_year: '2026-2027', start_date: '', end_date: '' });
    }
    setIsModalOpen(true);
  };

  // Mở modal Sửa
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Xử lý gửi Form Thêm / Sửa
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const idKey = currentTab.idKey;
      if (modalMode === 'create') {
        await axiosClient.post(`${currentTab.endpoint}/`, formData);
        setToast({ type: 'success', message: `Thêm ${currentTab.label} mới thành công!` });
      } else {
        const id = formData[idKey];
        await axiosClient.put(`${currentTab.endpoint}/${id}`, formData);
        setToast({ type: 'success', message: `Cập nhật ${currentTab.label} thành công!` });
      }
      setIsModalOpen(false);
      fetchCategoryData(activeTabId);
    } catch (err) {
      console.error('Lỗi lưu dữ liệu:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Không thể lưu bản ghi!';
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận xóa
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleting(true);
    try {
      const id = deleteModal.item[currentTab.idKey];
      await axiosClient.delete(`${currentTab.endpoint}/${id}`);
      setToast({ type: 'success', message: `Đã xóa bản ghi thành công!` });
      setDeleteModal({ open: false, item: null });
      fetchCategoryData(activeTabId);
    } catch (err) {
      console.error('Lỗi xóa bản ghi:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể xóa do bản ghi đang có ràng buộc dữ liệu!',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleImportFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = '';
    if (!selectedFile) return;

    const category = activeTabId;
    if (!IMPORT_COLUMN_HINTS[category]) return;
    if (!/\.(csv|xlsx|xls)$/i.test(selectedFile.name)) {
      setToast({ type: 'error', message: 'Chỉ hỗ trợ file .csv, .xlsx hoặc .xls.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    setImporting(true);
    setImportResult(null);
    try {
      const result = await axiosClient.post(
        `/admin/training-data/import/${category}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setImportResult({ ...result, category });
      setToast({
        type: result.error_rows > 0 ? 'error' : 'success',
        message: `Đã thêm ${result.imported_rows}/${result.total_rows} dòng. ${
          result.error_rows > 0
            ? `${result.error_rows} dòng cần kiểm tra; tải CSV lỗi bên dưới.`
            : 'Không có dòng lỗi.'
        }`,
      });
      await Promise.all([fetchCategoryData(category), fetchReferenceData()]);
    } catch (err) {
      console.error('Lỗi import dữ liệu đào tạo:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể import file Excel.',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const category = activeTabId;
    if (!IMPORT_COLUMN_HINTS[category]) return;

    setDownloadingTemplate(true);
    try {
      const file = await axiosClient.get(
        `/admin/training-data/import/templates/${category}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = IMPORT_FILE_NAMES[category].template;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setToast({ type: 'success', message: 'Đã tải file Excel mẫu.' });
    } catch (err) {
      console.error('Lỗi tải file Excel mẫu:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tải file Excel mẫu.',
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadImportErrors = () => {
    if (!importResult?.errors?.length) return;

    const sourceHeaders = Object.keys(importResult.errors[0].values);
    const escapeCsv = (value) => {
      const text = String(value ?? '');
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['Dòng', ...sourceHeaders, 'Lỗi'],
      ...importResult.errors.map((item) => [
        item.row,
        ...sourceHeaders.map((header) => item.values[header] || ''),
        item.error,
      ]),
    ];
    const csvContent = '\uFEFF' + rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = IMPORT_FILE_NAMES[importResult.category].errors;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Tra cứu tên khoa theo faculty_id
  const getFacultyName = (facultyId) => {
    const f = (dataMap.faculties || []).find((fac) => fac && fac.faculty_id === Number(facultyId));
    return f ? f.faculty_name : `Khoa #${facultyId}`;
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. THẺ TIÊU ĐỀ TRANG & TỔNG QUAN */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#002060] via-[#083082] to-[#0b3d9f] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                <Database size={22} className="text-amber-300" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  Quản Lý Dữ Liệu Đào Tạo
                </h1>
               
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {IMPORT_COLUMN_HINTS[activeTabId] && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  title={`Tải file Excel mẫu gồm: ${IMPORT_COLUMN_HINTS[activeTabId]}`}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <Download size={14} className={downloadingTemplate ? 'animate-pulse' : ''} />
                  <span>{downloadingTemplate ? 'Đang tải mẫu...' : 'Tải file mẫu'}</span>
                </button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFileChange}
                />
                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                  disabled={importing}
                  title={`Cột file: ${IMPORT_COLUMN_HINTS[activeTabId]}`}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <UploadCloud size={14} className={importing ? 'animate-pulse' : ''} />
                  <span>{importing ? 'Đang import...' : 'Import CSV/Excel'}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                fetchCategoryData(activeTabId);
                fetchReferenceData();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-300 active:scale-95"
            >
              <Plus size={16} />
              <span>Thêm {currentTab.label}</span>
            </button>
          </div>
        </div>

        {/* 6 THẺ THỐNG KÊ NHANH CHO 6 DANH MỤC */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = dataMap[tab.id]?.length || 0;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTabId(tab.id);
                  setImportResult(null);
                }}
                className={`flex flex-col rounded-xl p-3 text-left transition-all ${
                  isActive
                    ? 'bg-white text-[#002060] shadow-md ring-2 ring-amber-400 scale-[1.02]'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon size={18} className={isActive ? 'text-[#002060]' : 'text-blue-200'} />
                  <span className={`text-base font-black ${isActive ? 'text-[#002060]' : 'text-amber-300'}`}>
                    {count}
                  </span>
                </div>
                <span className="mt-2 truncate text-[11px] font-bold">
                  {tab.label}
                </span>
              </button>
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

      {importResult?.category === activeTabId && importResult.error_rows > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            File có {importResult.error_rows} dòng chưa được nhập. Tải danh sách lỗi, chỉnh sửa
            các dòng đó rồi import lại.
          </span>
          <button
            type="button"
            onClick={handleDownloadImportErrors}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 font-bold text-white transition hover:bg-amber-700"
          >
            <Download size={14} />
            Tải CSV dòng lỗi
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Ô TÌM KIẾM */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Tìm kiếm trong ${currentTab.label.toLowerCase()} (mã, tên)...`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 outline-none transition focus:border-[#002060] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* BỘ LỌC KHOA (CHO LỚP SV VÀ GIẢNG VIÊN) */}
          {(activeTabId === 'student_classes' || activeTabId === 'lecturers') && (
            <div className="flex items-center gap-1.5">
              <Filter size={15} className="text-slate-400 shrink-0" />
              <select
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả các khoa</option>
                {dataMap.faculties.map((f) => (
                  <option key={f.faculty_id} value={f.faculty_id}>
                    {f.faculty_name} ({f.faculty_code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-right text-[11px] font-semibold text-slate-500">
          Hiển thị: <span className="font-bold text-[#002060]">{filteredList.length}</span> / {dataMap[activeTabId]?.length || 0} bản ghi
          {IMPORT_COLUMN_HINTS[activeTabId] && (
            <>
              <div className="mt-1 font-normal text-slate-400">
                Cột file: {IMPORT_COLUMN_HINTS[activeTabId]}
              </div>
              {activeTabId === 'lecturers' && (
                <div className="mt-1 font-normal text-slate-400">
                  Số điện thoại có thể để trống; mẫu Excel định dạng cột này là văn bản để giữ số 0 đầu.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BẢNG DỮ LIỆU ĐÀO TẠO (DATA TABLE) */}
      {/* ============================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-[#002060]">
              <tr>
                <th className="px-4 py-3.5 text-center w-14">STT</th>

                {/* 1. KHOA */}
                {activeTabId === 'faculties' && (
                  <>
                    <th className="px-4 py-3.5">Mã khoa</th>
                    <th className="px-4 py-3.5">Tên khoa / Đơn vị</th>
                    <th className="px-4 py-3.5">Mô tả</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  </>
                )}

                {/* 2. LỚP SINH VIÊN */}
                {activeTabId === 'student_classes' && (
                  <>
                    <th className="px-4 py-3.5">Mã lớp</th>
                    <th className="px-4 py-3.5">Tên lớp sinh viên</th>
                    <th className="px-4 py-3.5">Khoa phụ trách</th>
                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  </>
                )}

                {/* 3. GIẢNG VIÊN */}
                {activeTabId === 'lecturers' && (
                  <>
                    <th className="px-4 py-3.5">Mã GV</th>
                    <th className="px-4 py-3.5">Họ và tên giảng viên</th>
                    <th className="px-4 py-3.5">Email liên hệ</th>
                    <th className="px-4 py-3.5">Số điện thoại</th>
                    <th className="px-4 py-3.5">Khoa trực thuộc</th>
                  </>
                )}

                {/* 4. HỌC PHẦN */}
                {activeTabId === 'courses' && (
                  <>
                    <th className="px-4 py-3.5">Mã học phần</th>
                    <th className="px-4 py-3.5">Tên học phần</th>
                    <th className="px-4 py-3.5">Mô tả tóm tắt</th>
                  </>
                )}

                {/* 5. LỚP HỌC PHẦN */}
                {activeTabId === 'course_sections' && (
                  <>
                    <th className="px-4 py-3.5">Mã lớp học phần</th>
                    <th className="px-4 py-3.5">Tên môn học</th>
                    <th className="px-4 py-3.5">Giảng viên giảng dạy</th>
                    <th className="px-4 py-3.5">Học kỳ áp dụng</th>
                  </>
                )}

                {/* 6. HỌC KỲ */}
                {activeTabId === 'academic_terms' && (
                  <>
                    <th className="px-4 py-3.5">Mã học kỳ</th>
                    <th className="px-4 py-3.5">Tên học kỳ</th>
                    <th className="px-4 py-3.5">Năm học</th>
                    <th className="px-4 py-3.5">Ngày bắt đầu</th>
                    <th className="px-4 py-3.5">Ngày kết thúc</th>
                  </>
                )}

                <th className="px-4 py-3.5 text-right w-24">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#002060]" />
                      <span>Đang tải dữ liệu {currentTab.label}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-500">Chưa có bản ghi nào phù hợp.</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Hãy nhấn nút &ldquo;Thêm {currentTab.label}&rdquo; ở trên để tạo mới.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  return (
                    <tr
                      key={item[currentTab.idKey] || idx}
                      className="transition-colors hover:bg-blue-50/40"
                    >
                      <td className="px-4 py-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* 1. KHOA */}
                      {activeTabId === 'faculties' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.faculty_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.faculty_name}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                            {item.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 2. LỚP SINH VIÊN */}
                      {activeTabId === 'student_classes' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.class_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.class_name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {getFacultyName(item.faculty_id)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                item.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 3. GIẢNG VIÊN */}
                      {activeTabId === 'lecturers' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.lecturer_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.full_name}
                          </td>
                          <td className="px-4 py-3 text-blue-600">
                            {item.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.phone || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.faculty_id ? getFacultyName(item.faculty_id) : '—'}
                          </td>
                        </>
                      )}

                      {/* 4. HỌC PHẦN */}
                      {activeTabId === 'courses' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.course_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.course_name}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-sm truncate">
                            {item.description || '—'}
                          </td>
                        </>
                      )}

                      {/* 5. LỚP HỌC PHẦN */}
                      {activeTabId === 'course_sections' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.section_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.course_name || `Học phần #${item.course_id}`}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.lecturer_name || `Giảng viên #${item.lecturer_id}`}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#002060]">
                              {item.term_name || `Học kỳ #${item.term_id}`}
                              {item.academic_year ? ` (${item.academic_year})` : ''}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 6. HỌC KỲ */}
                      {activeTabId === 'academic_terms' && (
                        <>
                          <td className="px-4 py-3 font-bold text-[#002060]">
                            {item.term_code}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {item.term_name}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {item.academic_year}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.start_date || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.end_date || '—'}
                          </td>
                        </>
                      )}

                      {/* NÚT THAO TÁC SỬA / XÓA */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Chỉnh sửa bản ghi"
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            title="Xóa bản ghi"
                            onClick={() => setDeleteModal({ open: true, item })}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL THÊM / CHỈNH SỬA BẢN GHI */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold">
                {modalMode === 'create' ? `Thêm mới ${currentTab.label}` : `Cập nhật ${currentTab.label}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* 1. FORM CHO KHOA */}
              {activeTabId === 'faculties' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã khoa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.faculty_code || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_code: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: SET, CNTT, KT..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên khoa đầy đủ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.faculty_name || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                      placeholder="Ví dụ: Trường Kỹ thuật và Công nghệ"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả thông tin
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Thông tin giới thiệu về khoa..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trạng thái hoạt động
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="active">Hoạt động (Active)</option>
                      <option value="inactive">Khóa tạm ngưng (Inactive)</option>
                    </select>
                  </div>
                </>
              )}

              {/* 2. FORM CHO LỚP SINH VIÊN */}
              {activeTabId === 'student_classes' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã lớp sinh viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.class_code || ''}
                      onChange={(e) => setFormData({ ...formData, class_code: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: DA23TTB, DA22TTA..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên lớp sinh viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.class_name || ''}
                      onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                      placeholder="Ví dụ: Đại học Công nghệ thông tin B khóa 2023"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trực thuộc khoa <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.faculty_id || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn khoa trực thuộc --</option>
                      {dataMap.faculties.map((f) => (
                        <option key={f.faculty_id} value={f.faculty_id}>
                          {f.faculty_name} ({f.faculty_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 3. FORM CHO GIẢNG VIÊN */}
              {activeTabId === 'lecturers' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã giảng viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lecturer_code || ''}
                      onChange={(e) => setFormData({ ...formData, lecturer_code: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: GV001, GV102..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên giảng viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name || ''}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Ví dụ: ThS. Trịnh Quốc Việt"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="gv@tvu.edu.vn"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912345678"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Khoa trực thuộc
                    </label>
                    <select
                      value={formData.faculty_id || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Không chọn / Trực thuộc trường --</option>
                      {dataMap.faculties.map((f) => (
                        <option key={f.faculty_id} value={f.faculty_id}>
                          {f.faculty_name} ({f.faculty_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 4. FORM CHO HỌC PHẦN */}
              {activeTabId === 'courses' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã học phần <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.course_code || ''}
                      onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: IT101, WEB202..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên học phần <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.course_name || ''}
                      onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                      placeholder="Ví dụ: Lập trình Web nâng cao"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mô tả tóm tắt
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tóm tắt nội dung học phần..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              )}

              {/* 5. FORM CHO LỚP HỌC PHẦN */}
              {activeTabId === 'course_sections' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã lớp học phần <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.section_code || ''}
                      onChange={(e) => setFormData({ ...formData, section_code: e.target.value.toUpperCase() })}
                      placeholder="Ví dụ: DA23TTB-WEB-01..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Học phần / Môn học <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.course_id || ''}
                      onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn môn học --</option>
                      {dataMap.courses.map((c) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_name} ({c.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giảng viên giảng dạy <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.lecturer_id || ''}
                      onChange={(e) => setFormData({ ...formData, lecturer_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn giảng viên --</option>
                      {dataMap.lecturers.map((l) => (
                        <option key={l.lecturer_id} value={l.lecturer_id}>
                          {l.full_name} ({l.lecturer_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Học kỳ mở lớp <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.term_id || ''}
                      onChange={(e) => setFormData({ ...formData, term_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn học kỳ --</option>
                      {dataMap.academic_terms.map((t) => (
                        <option key={t.term_id} value={t.term_id}>
                          {t.term_name} ({t.academic_year})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 6. FORM CHO HỌC KỲ */}
              {activeTabId === 'academic_terms' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã học kỳ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.term_code || ''}
                      onChange={(e) => setFormData({ ...formData, term_code: e.target.value })}
                      placeholder="Ví dụ: HK1_2026_2027"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tên học kỳ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.term_name || ''}
                        onChange={(e) => setFormData({ ...formData, term_name: e.target.value })}
                        placeholder="Học kỳ I"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Năm học <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.academic_year || ''}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        placeholder="2026-2027"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Nút hành động */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#002060] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#001748] transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL XÁC NHẬN XÓA BẢN GHI */}
      {/* ============================================================== */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Xác nhận xóa {currentTab.label}
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Bạn có chắc chắn muốn xóa bản ghi{' '}
              <strong className="text-rose-600 font-bold">
                {deleteModal.item?.[currentTab.nameKey] || deleteModal.item?.[currentTab.codeKey]}
              </strong>
              ? Hành động này không thể hoàn tác nếu đã có dữ liệu ràng buộc.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, item: null })}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
