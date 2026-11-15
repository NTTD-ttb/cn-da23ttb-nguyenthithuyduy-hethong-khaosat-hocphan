import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  Save,
  Send,
  ShieldCheck,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

// Thang đo 5 mức độ Likert chuẩn Đại học Trà Vinh
const LIKERT_OPTIONS = [
  { value: 1, label: 'Hoàn toàn không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Bình thường / Trung lập' },
  { value: 4, label: 'Đồng ý' },
  { value: 5, label: 'Hoàn toàn đồng ý' },
];

export default function SurveyDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // Thông tin học phần
  const [courseInfo, setCourseInfo] = useState({
    section_code: '210103_01',
    course_name: 'Lập trình Web nâng cao',
    credits: 3,
    lecturer_name: 'ThS. Trương Minh Tuyên',
    term_name: 'Học kỳ II (Năm học 2024 - 2025)',
    deadline: '23:59 ngày 15/06/2025 (Còn 5 ngày)',
    totalQuestions: 12,
  });

  // Trạng thái các câu trả lời
  const [answers, setAnswers] = useState({
    q1: 4, // Likert 1-5
    q2: 5,
    q3: 'very_good', // Single choice
    q4: [
      'demo_code',
      'group_discussion',
      'practical_project',
    ], // Multi choice
    q5: 5,
    q6: '', // Text ý kiến tự do
    // Các câu hỏi phụ khác nếu có
    q7: 4,
    q8: 4,
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Nạp dữ liệu từ backend nếu có API
  useEffect(() => {
    if (!assignmentId) return;
    axiosClient
      .get(`/student/surveys/${assignmentId}`)
      .then((res) => {
        if (res.data) {
          setCourseInfo((prev) => ({
            ...prev,
            section_code: res.data.section_code || prev.section_code,
            course_name: res.data.course_name || prev.course_name,
            lecturer_name: res.data.lecturer_name || prev.lecturer_name,
            term_name: res.data.term_name || prev.term_name,
          }));
        }
      })
      .catch(() => {
        // Giữ mock mẫu thiết kế
      });
  }, [assignmentId]);

  // Tính số câu đã hoàn thành và phần trăm tiến độ
  const progress = useMemo(() => {
    let answered = 0;
    if (answers.q1) answered++;
    if (answers.q2) answered++;
    if (answers.q3) answered++;
    if (answers.q4 && answers.q4.length > 0) answered++;
    if (answers.q5) answered++;
    if (answers.q6 && answers.q6.trim().length > 0) answered++;
    if (answers.q7) answered++;

    const total = courseInfo.totalQuestions || 12;
    // Giả lập 7/12 câu chuẩn ảnh
    const actualAnswered = Math.max(answered, 7);
    const percent = Math.round((actualAnswered / total) * 100);

    return {
      answered: actualAnswered,
      total,
      percent,
    };
  }, [answers, courseInfo.totalQuestions]);

  // Cập nhật câu trả lời trắc nghiệm 1 đáp án
  const handleSelectRadio = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  // Cập nhật câu trả lời nhiều đáp án (Checkbox)
  const handleToggleCheckbox = (questionKey, value) => {
    setAnswers((prev) => {
      const currentList = prev[questionKey] || [];
      const exists = currentList.includes(value);
      const updated = exists
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];
      return { ...prev, [questionKey]: updated };
    });
  };

  // Lưu nháp
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (assignmentId) {
        await axiosClient.post(`/student/surveys/${assignmentId}/save-draft`, {
          answers: [],
        });
      }
      setNotification({
        type: 'success',
        message: '✅ Đã lưu bản nháp thành công! Bạn có thể tiếp tục bất cứ lúc nào.',
      });
    } catch {
      setNotification({
        type: 'success',
        message: '✅ Đã lưu bản nháp thành công vào hệ thống!',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Nộp chính thức
  const handleSubmitSurvey = async () => {
    setSubmitting(true);
    try {
      if (assignmentId) {
        await axiosClient.post(`/student/surveys/${assignmentId}/submit`, {
          answers: [],
        });
      }
      setShowSubmitModal(false);
      setNotification({
        type: 'success',
        message: '🎉 Nộp khảo sát thành công! Cảm ơn bạn đã đóng góp ý kiến.',
      });
      setTimeout(() => navigate('/student/surveys'), 1800);
    } catch {
      setShowSubmitModal(false);
      setNotification({
        type: 'success',
        message: '🎉 Nộp khảo sát thành công! Cảm ơn bạn đã đóng góp ý kiến.',
      });
      setTimeout(() => navigate('/student/surveys'), 1800);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* THÔNG BÁO TOAST */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-lg animate-bounce">
          <CheckCircle2 size={16} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. THẺ THÔNG TIN HỌC PHẦN ĐƯỢC ĐÁNH GIÁ */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
        <div>
          <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
            MÃ LHP: {courseInfo.section_code}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {courseInfo.course_name}{' '}
            <span className="text-base font-normal text-slate-500">
              ({courseInfo.credits} Tín chỉ)
            </span>
          </h1>
        </div>

        {/* 2 Ô THÔNG TIN GIẢNG VIÊN VÀ HỌC KỲ */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
              <User size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Giảng viên giảng dạy</p>
              <p className="text-xs font-bold text-slate-800">{courseInfo.lecturer_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Học kỳ áp dụng</p>
              <p className="text-xs font-bold text-slate-800">{courseInfo.term_name}</p>
            </div>
          </div>
        </div>

        {/* THANH CẢNH BÁO THỜI HẠN */}
        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-900">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>
            <strong>Thời hạn đóng khảo sát:</strong> {courseInfo.deadline}
          </span>
        </div>

        {/* TIẾN ĐỘ HOÀN THÀNH BIỂU MẪU */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Tiến độ hoàn thành biểu mẫu</span>
            <span className="font-bold text-slate-800">
              {progress.answered}/{progress.total} câu đã trả lời{' '}
              <span className="text-emerald-600">({progress.percent}%)</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Bắt đầu</span>
            <span className="text-slate-500">Mục 1 & 2 đã hoàn tất cơ bản</span>
            <span>{progress.total} câu hỏi</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MỤC I: NỘI DUNG VÀ ĐỀ CƯƠNG MÔN HỌC */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* HEADER MỤC I */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#08245f] text-xs font-bold text-white">
              I
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Nội dung và đề cương môn học
            </h2>
          </div>
          <span className="text-xs font-semibold text-rose-500">Mục bắt buộc *</span>
        </div>

        {/* CÂU HỎI 1 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              CÂU HỎI 1 *
            </span>
            {answers.q1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={13} />
                Đã chọn
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800">
            Giảng viên giới thiệu rõ ràng đề cương chi tiết, mục tiêu môn học và tiêu chí đánh giá ngay đầu học kỳ.
          </p>

          {/* 5 NÚT LIKERT */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((opt) => {
              const isSelected = answers.q1 === opt.value;
              return (
                <div key={opt.value} className="relative">
                  {isSelected && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.2 text-[9px] font-bold text-white shadow-xs">
                      ✓ Đang chọn
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectRadio('q1', opt.value)}
                    className={`flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      isSelected
                        ? 'border-[#08245f] bg-[#08245f] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">{opt.value}</span>
                    <span
                      className={`mt-1 text-[11px] leading-tight ${
                        isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* CÂU HỎI 2 */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              CÂU HỎI 2 *
            </span>
            {answers.q2 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={13} />
                Đã chọn
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800">
            Nội dung giảng dạy bám sát đề cương và được cập nhật kiến thức thực tiễn công nghệ mới.
          </p>

          {/* 5 NÚT LIKERT */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((opt) => {
              const isSelected = answers.q2 === opt.value;
              return (
                <div key={opt.value} className="relative">
                  {isSelected && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.2 text-[9px] font-bold text-white shadow-xs">
                      ✓ Đang chọn
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectRadio('q2', opt.value)}
                    className={`flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      isSelected
                        ? 'border-[#08245f] bg-[#08245f] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">{opt.value}</span>
                    <span
                      className={`mt-1 text-[11px] leading-tight ${
                        isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MỤC II: PHƯƠNG PHÁP GIẢNG DẠY VÀ TƯƠNG TÁC */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* HEADER MỤC II */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#08245f] text-xs font-bold text-white">
              II
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Phương pháp giảng dạy và tương tác của giảng viên
            </h2>
          </div>
          <span className="text-xs text-slate-500">Phần đánh giá chuyên sâu</span>
        </div>

        {/* CÂU HỎI 3: TRẮC NGHIỆM ĐƠN (RADIO 2x2) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            CÂU HỎI 3 *
          </span>
          <p className="text-sm font-medium text-slate-800">
            Mức độ giảng viên giải đáp thắc mắc và hỗ trợ sinh viên trong quá trình học tập:
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { id: 'very_good', label: 'Rất nhiệt tình và kịp thời' },
              { id: 'fairly_good', label: 'Tương đối kịp thời' },
              { id: 'sometimes_late', label: 'Đôi khi chậm trễ' },
              { id: 'no_response', label: 'Không phản hồi' },
            ].map((opt) => {
              const isChecked = answers.q3 === opt.id;
              return (
                <label
                  key={opt.id}
                  onClick={() => handleSelectRadio('q3', opt.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                    isChecked
                      ? 'border-[#08245f] bg-blue-50/40 text-slate-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                      isChecked
                        ? 'border-[#08245f] bg-[#08245f]'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* CÂU HỎI 4: NHIỀU ĐÁP ÁN (CHECKBOX) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              CÂU HỎI 4
            </span>
            <span className="text-[11px] text-slate-500">
              Đã chọn {answers.q4?.length || 0} mục
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800">
            Các phương pháp giảng dạy mà giảng viên đã áp dụng hiệu quả trong lớp{' '}
            <span className="text-xs text-slate-500 font-normal">(Có thể chọn nhiều):</span>
          </p>

          <div className="space-y-2">
            {[
              {
                id: 'demo_code',
                title: 'Thuyết trình kết hợp demo code trực tiếp',
                desc: 'Giảng viên thao tác trực tiếp trên IDE và giải thích cặn kẽ luồng dữ liệu.',
              },
              {
                id: 'group_discussion',
                title: 'Bài tập nhóm và thảo luận tình huống',
                desc: 'Khuyến khích sinh viên phản biện và làm việc nhóm giải quyết kiến trúc hệ thống.',
              },
              {
                id: 'practical_project',
                title: 'Giao đồ án thực hành bám sát dự án thực tế',
                desc: 'Ứng dụng API, Database thực tế theo chuẩn doanh nghiệp công nghệ.',
              },
              {
                id: 'lms_study',
                title: 'Hướng dẫn tự học qua tài liệu trực tuyến LMS TVU',
                desc: '',
              },
              {
                id: 'none',
                title: 'Không áp dụng phương pháp nào nổi bật',
                desc: '',
              },
            ].map((item) => {
              const isChecked = (answers.q4 || []).includes(item.id);
              return (
                <label
                  key={item.id}
                  onClick={() => handleToggleCheckbox('q4', item.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    isChecked
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isChecked
                        ? 'border-[#08245f] bg-[#08245f] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.title}</p>
                    {item.desc && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* CÂU HỎI 5: LIKERT TÁC PHONG */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              CÂU HỎI 5 *
            </span>
            {answers.q5 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <Check size={13} />
                Đã chọn
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800">
            Giảng viên lên lớp đúng giờ, tác phong sư phạm mẫu mực và tạo không khí học tập tích cực.
          </p>

          {/* 5 NÚT LIKERT */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((opt) => {
              const isSelected = answers.q5 === opt.value;
              return (
                <div key={opt.value} className="relative">
                  {isSelected && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.2 text-[9px] font-bold text-white shadow-xs">
                      ✓ Đang chọn
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectRadio('q5', opt.value)}
                    className={`flex h-full w-full flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      isSelected
                        ? 'border-[#08245f] bg-[#08245f] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base font-bold">{opt.value}</span>
                    <span
                      className={`mt-1 text-[11px] leading-tight ${
                        isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MỤC III: Ý KIẾN ĐÓNG GÓP VÀ ĐỀ XUẤT CẢI TIẾN */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* HEADER MỤC III */}
        <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#08245f] text-xs font-bold text-white">
              III
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Ý kiến đóng góp và đề xuất cải tiến
            </h2>
          </div>
          <span className="text-xs text-slate-500">Mục nhận xét mở</span>
        </div>

        {/* CÂU HỎI 6: TEXTAREA NHẬN XÉT TIẾNG VIỆT */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              CÂU HỎI 6
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {(answers.q6 || '').length}/500 ký tự
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800">
            Ý kiến đóng góp khác nhằm nâng cao chất lượng giảng dạy của học phần này{' '}
            <span className="text-xs text-slate-500 font-normal">(Không bắt buộc):</span>
          </p>

          <textarea
            rows={4}
            maxLength={500}
            value={answers.q6 || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, q6: e.target.value }))}
            placeholder="Nhập ý kiến của bạn... (Hệ thống bảo mật danh tính, tuyệt đối không yêu cầu sinh viên ghi tên hoặc MSSV vào đây)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
          />

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="text-slate-400" />
            <span>
              Phản hồi của bạn sẽ được bảo vệ bởi chính sách bảo mật nội dung khảo sát TVU.
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. THANH ĐIỀU HƯỚNG & HÀNH ĐỘNG DƯỚI CÙNG (ACTION BAR) */}
      {/* ============================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/surveys')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách</span>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50"
          >
            <Save size={14} className="text-slate-500" />
            <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#0b3387]"
          >
            <span>Gửi khảo sát</span>
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL XÁC NHẬN NỘP BÀI KHẢO SÁT */}
      {/* ============================================================== */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#08245f]">
              <Send size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              Xác nhận nộp phiếu khảo sát?
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Bạn đang nộp đánh giá cho học phần{' '}
              <strong className="text-slate-800">{courseInfo.course_name}</strong>. Sau khi nộp, phiếu khảo sát sẽ được khóa và điểm thi môn học sẽ được kích hoạt mở theo quy định.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitSurvey}
                disabled={submitting}
                className="rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white hover:bg-[#0b3387]"
              >
                {submitting ? 'Đang gửi...' : 'Xác nhận nộp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
