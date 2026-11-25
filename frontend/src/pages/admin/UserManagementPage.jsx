import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UploadCloud,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Edit2,
  Key,
  Trash2,
  Copy,
  Check,
  GraduationCap,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

// Danh sách màu ngẫu nhiên hài hòa cho Avatar tròn viết tắt
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

export default function UserManagementPage() {
  const { token } = useAuth();
  const currentUserId = useMemo(() => {
    const encodedPayload = token?.split('.')[1];
    if (!encodedPayload) return null;

    try {
      const payload = JSON.parse(
        atob(
          encodedPayload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')
        )
      );
      const userId = Number(payload.sub);
      return Number.isInteger(userId) ? userId : null;
    } catch {
      return null;
    }
  }, [token]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // State bộ lọc và tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sortField, setSortField] = useState('user_id');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Checkbox chọn hàng loạt
  const [selectedIds, setSelectedIds] = useState([]);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // State các Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [activeUser, setActiveUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State Import CSV/Excel
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  // Tự động tắt Toast thông báo sau 4 giây
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Tải danh sách người dùng từ API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/users/?limit=500');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setUsers(list);
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tải danh sách tài khoản.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách lớp sinh viên để nạp vào dropdown
  const fetchClasses = async () => {
    try {
      const res = await axiosClient.get('/admin/student-classes/?limit=200');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setClasses(list);
    } catch (err) {
      console.error('Lỗi tải danh mục lớp:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  // Sao chép email vào Clipboard
  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Lấy 2 chữ cái viết tắt tên để làm Avatar
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'TK';
  };

  // Chọn màu Avatar ổn định theo chuỗi tên
  const getAvatarColor = (str) => {
    if (!str) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  // Suy đoán khóa tuyển sinh từ MSSV (ví dụ: 110121045 -> Khóa 2021)
  const getAdmissionYear = (user) => {
    if (user.role === 'admin') return 'Tài khoản Quản trị hệ thống';
    const mssv = user.student_profile?.student_code || user.email?.split('@')[0] || '';
    if (mssv.length >= 6 && mssv.startsWith('1101')) {
      const yearPrefix = mssv.substring(4, 6);
      return `Khóa tuyển sinh 20${yearPrefix}`;
    }
    return 'Sinh viên chính quy';
  };

  // Xử lý Lọc & Tìm kiếm & Sắp xếp dữ liệu
  const processedUsers = useMemo(() => {
    let list = [...users];

    // 1. Tìm kiếm theo MSSV, Email, Họ và tên
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((u) => {
        const email = u.email?.toLowerCase() || '';
        const name = u.student_profile?.full_name?.toLowerCase() || '';
        const mssv = u.student_profile?.student_code?.toLowerCase() || '';
        const className = u.student_profile?.student_class?.class_code?.toLowerCase() || '';
        return (
          email.includes(term) ||
          name.includes(term) ||
          mssv.includes(term) ||
          className.includes(term)
        );
      });
    }

    // 2. Lọc theo Vai trò
    if (roleFilter) {
      list = list.filter((u) => u.role === roleFilter);
    }

    // 3. Lọc theo Trạng thái
    if (statusFilter === 'active') {
      list = list.filter((u) => !u.must_change_password);
    } else if (statusFilter === 'must_change') {
      list = list.filter((u) => u.must_change_password);
    }

    // 4. Lọc theo Lớp sinh viên
    if (classFilter) {
      list = list.filter((u) => {
        const cCode = u.student_profile?.student_class?.class_code;
        return cCode === classFilter;
      });
    }

    // 5. Sắp xếp
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'student_code') {
        valA = a.student_profile?.student_code || '';
        valB = b.student_profile?.student_code || '';
      } else if (sortField === 'full_name') {
        valA = a.student_profile?.full_name || '';
        valB = b.student_profile?.full_name || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, searchTerm, roleFilter, statusFilter, classFilter, sortField, sortOrder]);

  // Phân trang danh sách
  const totalRecords = processedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedUsers.slice(start, start + pageSize);
  }, [processedUsers, currentPage, pageSize]);

  // Xử lý chọn/bỏ chọn checkbox tất cả
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedUsers.map((u) => u.user_id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Thống kê nhanh các chỉ số KPI
  const stats = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.role === 'student').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const mustChange = users.filter((u) => u.must_change_password).length;
    return { total, students, admins, mustChange };
  }, [users]);

  // Đổi cột sắp xếp
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Mở modal Thêm thủ công
  const handleOpenCreate = () => {
    setFormData({
      role: 'student',
      email: '',
      password: 'User@123',
      student_code: '',
      full_name: '',
      class_id: classes[0]?.class_id || '',
      must_change_password: true,
    });
    setCreateModalOpen(true);
  };

  // Xử lý Thêm tài khoản thủ công
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        password: formData.password,
        must_change_password: Boolean(formData.must_change_password),
      };

      if (formData.role === 'student') {
        payload.student_code = formData.student_code?.trim() || formData.email.split('@')[0];
        payload.full_name = formData.full_name?.trim() || 'Sinh viên';
        payload.class_id = formData.class_id ? Number(formData.class_id) : undefined;
      }

      await axiosClient.post('/admin/users/', payload);
      setToast({ type: 'success', message: 'Tạo tài khoản người dùng mới thành công!' });
      setCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi tạo tài khoản:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể tạo tài khoản mới.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal Sửa
  const handleOpenEdit = (user) => {
    setActiveUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password,
      student_code: user.student_profile?.student_code || '',
      full_name: user.student_profile?.full_name || '',
      class_id: user.student_profile?.class_id || classes[0]?.class_id || '',
    });
    setEditModalOpen(true);
  };

  // Xử lý Cập nhật tài khoản
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        must_change_password: Boolean(formData.must_change_password),
      };

      if (formData.role === 'student') {
        payload.student_code = formData.student_code?.trim();
        payload.full_name = formData.full_name?.trim();
        payload.class_id = formData.class_id ? Number(formData.class_id) : undefined;
      }

      await axiosClient.put(`/admin/users/${activeUser.user_id}`, payload);
      setToast({ type: 'success', message: 'Cập nhật tài khoản thành công!' });
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi cập nhật tài khoản:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể cập nhật tài khoản.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal Reset Mật khẩu
  const handleOpenReset = (user) => {
    setActiveUser(user);
    setNewPassword('123456');
    setResetModalOpen(true);
  };

  // Xử lý Reset Mật khẩu
  const handleSubmitReset = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      await axiosClient.patch(`/admin/users/${activeUser.user_id}/reset-password`, {
        new_password: newPassword,
      });
      setToast({
        type: 'success',
        message: `Đã đặt lại mật khẩu cho ${activeUser.email} thành công!`,
      });
      setResetModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể đặt lại mật khẩu.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal Xóa
  const handleOpenDelete = (user) => {
    setActiveUser(user);
    setDeleteModalOpen(true);
  };

  // Xử lý Xóa tài khoản
  const handleSubmitDelete = async () => {
    if (!activeUser) return;
    setSubmitting(true);
    try {
      await axiosClient.delete(`/admin/users/${activeUser.user_id}`);
      setToast({ type: 'success', message: `Đã xóa tài khoản ${activeUser.email} thành công!` });
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi xóa tài khoản:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Không thể xóa tài khoản do có ràng buộc dữ liệu.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Xuất dữ liệu ra file CSV (có gắn UTF-8 BOM để Excel đọc tiếng Việt không bị lỗi font)
  const handleExportCSV = () => {
    if (processedUsers.length === 0) {
      setToast({ type: 'error', message: 'Không có dữ liệu tài khoản nào để xuất.' });
      return;
    }

    const headers = [
      'STT',
      'MSSV / Mã ĐD',
      'Họ và tên',
      'Email',
      'Vai trò',
      'Lớp hành chính',
      'Trạng thái',
      'Ngày tạo',
      'Cập nhật lần cuối',
    ];

    const rows = processedUsers.map((u, idx) => [
      idx + 1,
      u.student_profile?.student_code || (u.role === 'admin' ? 'ADMIN' : '—'),
      `"${u.student_profile?.full_name || (u.role === 'admin' ? 'Quản trị viên' : '—')}"`,
      u.email,
      u.role === 'admin' ? 'Quản trị viên' : 'Sinh viên',
      `"${u.student_profile?.student_class?.class_code || '—'}"`,
      u.must_change_password ? 'Yêu cầu đổi mật khẩu' : 'Đang hoạt động',
      u.created_account ? new Date(u.created_account).toLocaleDateString('vi-VN') : '',
      u.updated_account ? new Date(u.updated_account).toLocaleString('vi-VN') : '',
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_tai_khoan_TVU_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({ type: 'success', message: 'Đã xuất dữ liệu danh sách tài khoản thành công!' });
  };

  // Xử lý Import danh sách tài khoản hàng loạt
  const handleProcessImport = async () => {
    if (!importText.trim()) {
      setToast({ type: 'error', message: 'Vui lòng nhập hoặc dán danh sách tài khoản!' });
      return;
    }

    setImporting(true);
    const lines = importText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let successCount = 0;
    let failCount = 0;

    for (const line of lines) {
      // Định dạng dòng: email,password,mssv,fullname,class_code
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const [email, password, mssv, fullname, classCode] = parts;
        const matchedClass = classes.find((c) => c.class_code === classCode);

        try {
          await axiosClient.post('/admin/users/', {
            email,
            password: password || '123456',
            role: email.includes('admin') ? 'admin' : 'student',
            student_code: mssv || email.split('@')[0],
            full_name: fullname || 'Sinh viên',
            class_id: matchedClass?.class_id || classes[0]?.class_id,
            must_change_password: true,
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
    }

    setImporting(false);
    setImportModalOpen(false);
    setImportText('');
    fetchUsers();

    setToast({
      type: successCount > 0 ? 'success' : 'error',
      message: `Đã nhập xong: ${successCount} thành công, ${failCount} thất bại/trùng lặp.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. THẺ TIÊU ĐỀ TRANG & CÁC NÚT THAO TÁC HÀNG ĐẦU */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#002060] via-[#062c82] to-[#0d3c9b] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <Users size={24} className="text-amber-300" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Quản Lý Tài Khoản Người Dùng
              </h1>
              <p className="text-xs text-blue-100 sm:text-sm">
                Quản trị danh sách tài khoản sinh viên và quản trị viên, cấp mới và đặt lại mật khẩu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* NÚT LÀM MỚI */}
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* NÚT IMPORT DANH SÁCH */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95 border border-white/20"
            >
              <UploadCloud size={15} />
              <span>Import tài khoản</span>
            </button>

            {/* NÚT XUẤT DỮ LIỆU */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95 border border-white/20"
            >
              <Download size={15} />
              <span>Xuất dữ liệu</span>
            </button>

            {/* NÚT THÊM THỦ CÔNG */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-300 active:scale-95"
            >
              <UserPlus size={16} />
              <span>Thêm thủ công</span>
            </button>
          </div>
        </div>

        {/* 4 THẺ THỐNG KÊ KPI TÀI KHOẢN */}
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Tổng tài khoản</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Tài khoản Sinh viên</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{stats.students}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Tài khoản Quản trị</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">{stats.admins}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-sm border border-white/10">
            <p className="text-[11px] font-medium text-blue-200">Chờ đổi mật khẩu</p>
            <p className="mt-1 text-2xl font-black text-rose-300">{stats.mustChange}</p>
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
      {/* 2. THANH TÌM KIẾM & BỘ LỌC */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Ô TÌM KIẾM */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo MSSV, Họ tên, Email..."
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

          {/* LỌC THEO VAI TRÒ */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả vai trò</option>
              <option value="student">Sinh viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {/* LỌC THEO TRẠNG THÁI */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="must_change">Chờ đổi mật khẩu</option>
          </select>

          {/* LỌC THEO LỚP HÀNH CHÍNH */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Tất cả lớp hành chính</option>
            {classes.map((c) => (
              <option key={c.class_id} value={c.class_code}>
                {c.class_code} ({c.class_name})
              </option>
            ))}
          </select>
        </div>

        <div className="text-right text-[11px] font-semibold text-slate-500 shrink-0">
          Hiển thị: <span className="font-bold text-[#002060]">{processedUsers.length}</span> / {users.length} tài khoản
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BẢNG DANH SÁCH TÀI KHOẢN (DATA TABLE PHONG CÁCH HIỆN ĐẠI) */}
      {/* ============================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-[#002060]">
              <tr>
                {/* CHECKBOX CHỌN TẤT CẢ */}
                <th className="px-4 py-3.5 text-center w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every((u) => selectedIds.includes(u.user_id))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#002060] focus:ring-blue-200 cursor-pointer"
                  />
                </th>

                {/* MSSV */}
                <th
                  onClick={() => handleSort('student_code')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/60 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>MSSV / Mã ĐD</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>

                {/* HỌ VÀ TÊN */}
                <th
                  onClick={() => handleSort('full_name')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/60 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Họ và tên</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>

                {/* EMAIL */}
                <th className="px-4 py-3.5">Email tài khoản</th>

                {/* LỚP HÀNH CHÍNH */}
                <th className="px-4 py-3.5">Lớp hành chính</th>

                {/* TRẠNG THÁI */}
                <th className="px-4 py-3.5 text-center">Trạng thái tài khoản</th>

                {/* NGÀY TẠO / CẬP NHẬT */}
                <th
                  onClick={() => handleSort('created_account')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-100/60 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ngày tạo / Cập nhật</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>

                {/* THAO TÁC */}
                <th className="px-4 py-3.5 text-right w-28">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#002060]" />
                      <span>Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Không tìm thấy tài khoản nào phù hợp.</p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      Hãy thử đổi từ khóa tìm kiếm hoặc nhấn nút &ldquo;Thêm thủ công&rdquo; để tạo tài khoản mới.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isStudent = user.role === 'student';
                  const isCurrentUser = Number(user.user_id) === currentUserId;
                  const profile = user.student_profile;
                  const fullName = profile?.full_name || (isStudent ? 'Sinh viên' : 'Quản trị viên');
                  const mssv = profile?.student_code || (isStudent ? user.email.split('@')[0] : 'ADMIN');
                  const className = profile?.student_class?.class_code || '—';
                  const initials = getInitials(fullName, user.email);
                  const colorClass = getAvatarColor(fullName || user.email);
                  const admission = getAdmissionYear(user);
                  const isSelected = selectedIds.includes(user.user_id);

                  const createdDate = user.created_account
                    ? new Date(user.created_account).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '12/09/2021';

                  const updatedDate = user.updated_account
                    ? new Date(user.updated_account).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Chưa cập nhật';

                  return (
                    <tr
                      key={user.user_id}
                      className={`transition-colors hover:bg-blue-50/40 ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* CHECKBOX HÀNG */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(user.user_id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#002060] focus:ring-blue-200 cursor-pointer"
                        />
                      </td>

                      {/* MSSV */}
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {isStudent ? (
                          <span>{mssv}</span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-[#002060]">
                            ADMIN-{user.user_id}
                          </span>
                        )}
                      </td>

                      {/* HỌ VÀ TÊN & AVATAR */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${colorClass}`}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-tight">
                              {fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {admission}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL VÀ NÚT COPY */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700">
                            {user.email}
                          </span>
                          <button
                            type="button"
                            title="Sao chép email"
                            onClick={() => handleCopyEmail(user.email)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                          >
                            {copiedEmail === user.email ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* LỚP HÀNH CHÍNH */}
                      <td className="px-4 py-3">
                        {isStudent && className !== '—' ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                            <GraduationCap size={13} className="text-slate-500" />
                            {className}
                          </span>
                        ) : isStudent ? (
                          <span className="text-slate-400 italic">Chưa xếp lớp</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#002060]">
                            <ShieldCheck size={13} />
                            Ban Quản Trị
                          </span>
                        )}
                      </td>

                      {/* TRẠNG THÁI */}
                      <td className="px-4 py-3 text-center">
                        {user.must_change_password ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Chưa kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        )}
                      </td>

                      {/* NGÀY TẠO / CẬP NHẬT */}
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium text-slate-800">{createdDate}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          CN: {updatedDate}
                        </p>
                      </td>

                      {/* CÁC NÚT THAO TÁC */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* XEM CHI TIẾT */}
                          <button
                            type="button"
                            title="Xem chi tiết tài khoản"
                            onClick={() => {
                              setActiveUser(user);
                              setViewModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <Eye size={15} />
                          </button>

                          {/* SỬA THÔNG TIN */}
                          <button
                            type="button"
                            title="Chỉnh sửa tài khoản"
                            onClick={() => handleOpenEdit(user)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* RESET MẬT KHẨU */}
                          <button
                            type="button"
                            title="Đặt lại mật khẩu"
                            onClick={() => handleOpenReset(user)}
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition"
                          >
                            <Key size={15} />
                          </button>

                          <button
                            type="button"
                            title={
                              isCurrentUser
                                ? 'Không thể xóa tài khoản đang đăng nhập'
                                : 'Xóa tài khoản'
                            }
                            disabled={isCurrentUser}
                            onClick={() => handleOpenDelete(user)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-rose-500"
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

        {/* ============================================================== */}
        {/* PHÂN TRANG VÀ KÍCH THƯỚC TRANG */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-500">
              Hiển thị{' '}
              <strong className="text-slate-800">
                {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              –{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, totalRecords)}
              </strong>{' '}
              của <strong className="text-slate-800">{totalRecords}</strong> người dùng
            </span>
          </div>

          <div className="flex items-center gap-1 self-center sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={page} className="flex items-center">
                    {prev && page - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                        page === currentPage
                          ? 'bg-[#002060] text-white shadow-sm'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL THÊM MỚI TÀI KHOẢN THỦ CÔNG */}
      {/* ============================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserPlus size={18} />
                Thêm tài khoản người dùng thủ công
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4 text-xs">
              {/* Chọn vai trò */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vai trò tài khoản <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'student' })}
                    className={`rounded-xl border p-3 text-center font-bold transition ${
                      formData.role === 'student'
                        ? 'border-[#002060] bg-blue-50/60 text-[#002060] ring-1 ring-[#002060]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sinh viên (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`rounded-xl border p-3 text-center font-bold transition ${
                      formData.role === 'admin'
                        ? 'border-[#002060] bg-blue-50/60 text-[#002060] ring-1 ring-[#002060]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Quản trị viên (Admin)
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={formData.role === 'student' ? '110123081@st.tvu.edu.vn' : 'admin@tvu.edu.vn'}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Thông tin hồ sơ sinh viên nếu là sinh viên */}
              {formData.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Mã sinh viên (MSSV) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.student_code || ''}
                        onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                        placeholder="110123081"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Họ và tên sinh viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lớp hành chính <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.class_id || ''}
                      onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chọn lớp hành chính --</option>
                      {classes.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                          {c.class_code} — {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Checkbox bắt buộc đổi mật khẩu */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.must_change_password)}
                  onChange={(e) => setFormData({ ...formData, must_change_password: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#002060] focus:ring-blue-200 cursor-pointer"
                />
                <span className="font-medium text-slate-700">
                  Yêu cầu người dùng đổi mật khẩu ở lần đăng nhập đầu tiên
                </span>
              </label>

              {/* Nút hành động */}
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
                  {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL CHỈNH SỬA TÀI KHOẢN */}
      {/* ============================================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 size={18} />
                Chỉnh sửa thông tin tài khoản #{activeUser?.user_id}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email tài khoản <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={formData.role || 'student'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="student">Sinh viên (Student)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Mã sinh viên (MSSV)
                      </label>
                      <input
                        type="text"
                        value={formData.student_code || ''}
                        onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lớp hành chính
                    </label>
                    <select
                      value={formData.class_id || ''}
                      onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">-- Chưa xếp lớp --</option>
                      {classes.map((c) => (
                        <option key={c.class_id} value={c.class_id}>
                          {c.class_code} — {c.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.must_change_password)}
                  onChange={(e) => setFormData({ ...formData, must_change_password: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-[#002060] focus:ring-blue-200 cursor-pointer"
                />
                <span className="font-medium text-slate-700">
                  Bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo
                </span>
              </label>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white shadow-md hover:bg-[#001748] transition disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL RESET MẬT KHẨU NHANH */}
      {/* ============================================================== */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-amber-500 px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key size={18} />
                Đặt lại mật khẩu người dùng
              </h3>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReset} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-amber-900">
                <p className="font-bold">Tài khoản: {activeUser?.email}</p>
                <p className="text-[11px] mt-0.5 text-amber-700">
                  Họ tên:{' '}
                  <strong>
                    {activeUser?.student_profile?.full_name ||
                      (activeUser?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên')}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 font-mono outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewPassword('123456')}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Đặt mặc định: 123456
                </button>
                <button
                  type="button"
                  onClick={() => setNewPassword('Tvu@2026')}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Đặt: Tvu@2026
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * Sau khi reset, hệ thống sẽ tự động bật cờ <strong>bắt buộc đổi mật khẩu</strong> ở lần đăng nhập tiếp theo để bảo vệ an toàn tài khoản.
              </p>

              <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-white shadow-md hover:bg-amber-600 transition disabled:opacity-50"
                >
                  {submitting ? 'Đang cập nhật...' : 'Xác nhận reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL XEM CHI TIẾT TÀI KHOẢN */}
      {/* ============================================================== */}
      {viewModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Eye size={18} />
                Thông tin chi tiết tài khoản #{activeUser.user_id}
              </h3>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold border ${getAvatarColor(
                    activeUser.student_profile?.full_name || activeUser.email
                  )}`}
                >
                  {getInitials(activeUser.student_profile?.full_name, activeUser.email)}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {activeUser.student_profile?.full_name ||
                      (activeUser.role === 'admin' ? 'Quản trị viên hệ thống' : 'Sinh viên TVU')}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">{activeUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Vai trò</span>
                  <span className="font-bold text-[#002060]">
                    {activeUser.role === 'admin' ? 'Quản trị viên (Admin)' : 'Sinh viên (Student)'}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Mã số định danh</span>
                  <span className="font-bold text-slate-800">
                    {activeUser.student_profile?.student_code || 'ADMIN'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-2.5">
                <span className="text-[10px] text-slate-400 block font-medium">Lớp sinh viên</span>
                <span className="font-semibold text-slate-800">
                  {activeUser.student_profile?.student_class
                    ? `${activeUser.student_profile.student_class.class_code} — ${activeUser.student_profile.student_class.class_name}`
                    : activeUser.role === 'admin'
                    ? 'Phòng Đảm bảo chất lượng / Ban Quản trị'
                    : 'Chưa xếp lớp'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Trạng thái</span>
                  <span className="font-bold text-emerald-600">
                    {activeUser.must_change_password ? 'Chờ đổi mật khẩu' : 'Đang hoạt động'}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Ngày tạo</span>
                  <span className="font-medium text-slate-700">
                    {activeUser.created_account
                      ? new Date(activeUser.created_account).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white hover:bg-[#001748] transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL IMPORT DANH SÁCH TÀI KHOẢN (EXCEL / CSV) */}
      {/* ============================================================== */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#002060] px-6 py-4 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UploadCloud size={18} />
                Nhập danh sách tài khoản hàng loạt
              </h3>
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-100 text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <FileSpreadsheet size={16} />
                  Hướng dẫn định dạng nhập dữ liệu:
                </p>
                <p className="mt-1 text-[11px] text-blue-700">
                  Nhập hoặc dán mỗi dòng 1 tài khoản theo cấu trúc:
                </p>
                <code className="block mt-1.5 p-2 rounded-lg bg-white/80 text-[11px] font-mono text-slate-800 border border-blue-200">
                  email,password,mssv,fullname,class_code
                </code>
                <p className="mt-1 text-[10px] text-blue-600">
                  Ví dụ: <code>110123099@st.tvu.edu.vn,123456,110123099,Trần Văn An,DA23TTB</code>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung danh sách tài khoản:
                </label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Dán các dòng tài khoản vào đây..."
                  className="w-full rounded-xl border border-slate-200 p-3 font-mono text-[11px] outline-none focus:border-[#002060] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setImportText(
                      '110123101@st.tvu.edu.vn,123456,110123101,Nguyễn Hoàng Nam,DA23TTB\n110123102@st.tvu.edu.vn,123456,110123102,Lê Thị Mai,DA23TTA'
                    );
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Điền dữ liệu mẫu
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleProcessImport}
                    className="rounded-xl bg-[#002060] px-5 py-2 font-bold text-white shadow-md hover:bg-[#001748] transition disabled:opacity-50"
                  >
                    {importing ? 'Đang xử lý...' : 'Bắt đầu nạp'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL XÁC NHẬN XÓA TÀI KHOẢN */}
      {/* ============================================================== */}
      {deleteModalOpen && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center text-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Xác nhận xóa tài khoản
            </h3>
            <p className="mt-2 text-slate-500">
              Bạn có chắc chắn muốn xóa tài khoản{' '}
              <strong className="text-rose-600 font-bold">{activeUser.email}</strong>?
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Hành động này sẽ xóa vĩnh viễn và không thể khôi phục nếu tài khoản đã phát sinh dữ liệu khảo sát.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white shadow-md hover:bg-rose-700 transition disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
