import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Save,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const LIKERT_OPTIONS = [
  { value: 1, label: 'Hoàn toàn không đồng ý' },
  { value: 2, label: 'Không đồng ý' },
  { value: 3, label: 'Bình thường / Trung lập' },
  { value: 4, label: 'Đồng ý' },
  { value: 5, label: 'Hoàn toàn đồng ý' },
];

const EMPTY_QUESTIONS = [];

const getQuestionOptions = (options) => {
  if (Array.isArray(options)) {
    return options.map((option, index) =>
      typeof option === 'object' && option !== null
        ? {
            value: option.value ?? option.id ?? option.label ?? index,
            label: option.label ?? option.title ?? String(option.value ?? option.id ?? ''),
          }
        : { value: option, label: String(option) }
    );
  }

  if (options && typeof options === 'object') {
    const items = options.options || options.items;
    if (Array.isArray(items)) return getQuestionOptions(items);
    return Object.entries(options).map(([value, label]) => ({
      value,
      label: String(label),
    }));
  }

  return [];
};

const isQuestionAnswered = (question, value) => {
  if (value === undefined || value === null || value === '') return false;
  if (question.question_type === 'text') return String(value).trim().length > 0;
  if (question.question_type === 'multiple_choice') {
    return Array.isArray(value) && value.length > 0;
  }
  return true;
};

const getErrorMessage = (error) =>
  error.response?.data?.detail || error.message || 'Đã xảy ra lỗi, vui lòng thử lại.';

export default function SurveyDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedAssignmentId, setLoadedAssignmentId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let active = true;

    const loadSurvey = async () => {
      try {
        if (!assignmentId) throw new Error('Không tìm thấy mã phân công khảo sát.');

        const [detailResult, listResult] = await Promise.allSettled([
          axiosClient.get(`/student/surveys/${assignmentId}`),
          axiosClient.get('/student/surveys'),
        ]);
        if (detailResult.status === 'rejected') throw detailResult.reason;
        if (!active) return;

        const detail = detailResult.value?.data || detailResult.value;
        if (!detail || !Array.isArray(detail.questions)) {
          throw new Error('Dữ liệu khảo sát trả về không hợp lệ.');
        }

        const restoredAnswers = {};
        (detail.saved_answers || []).forEach((answer) => {
          const question = detail.questions.find(
            (item) => item.question_id === answer.question_id
          );
          if (!question) return;
          if (question.question_type === 'rating') {
            restoredAnswers[answer.question_id] = answer.answer_number;
          } else if (question.question_type === 'text') {
            restoredAnswers[answer.question_id] = answer.answer_text || '';
          } else {
            restoredAnswers[answer.question_id] =
              answer.answer_json ??
              (question.question_type === 'multiple_choice' ? [] : '');
          }
        });

        setSurvey(detail);
        setAnswers(restoredAnswers);
        setLoadError('');

        if (listResult.status === 'fulfilled') {
          const rawList = listResult.value?.data || listResult.value;
          const list = Array.isArray(rawList) ? rawList : [];
          const assignment = list.find(
            (item) => String(item.assignment_id) === String(assignmentId)
          );
          setDeadline(assignment?.end_date || null);
        } else {
          setDeadline(null);
          setNotification({
            type: 'error',
            message: `Không thể tải thời hạn khảo sát: ${getErrorMessage(listResult.reason)}`,
          });
        }
      } catch (error) {
        if (active) setLoadError(getErrorMessage(error));
      } finally {
        if (active) {
          setLoadedAssignmentId(assignmentId ?? null);
          setLoading(false);
        }
      }
    };

    loadSurvey();
    return () => {
      active = false;
    };
  }, [assignmentId]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const questions = survey?.questions ?? EMPTY_QUESTIONS;
  const progress = useMemo(() => {
    const answered = questions.filter((question) =>
      isQuestionAnswered(question, answers[question.question_id])
    ).length;
    const total = questions.length;
    return {
      answered,
      total,
      percent: total ? Math.round((answered / total) * 100) : 0,
    };
  }, [answers, questions]);

  const updateAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const buildAnswersPayload = () => ({
    answers: questions.map((question) => {
      const value = answers[question.question_id];
      return {
        question_id: question.question_id,
        answer_text: question.question_type === 'text' ? value || null : null,
        answer_number: question.question_type === 'rating' ? value ?? null : null,
        answer_json:
          question.question_type === 'single_choice' ||
          question.question_type === 'multiple_choice'
            ? value ?? null
            : null,
      };
    }),
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const result = await axiosClient.post(
        `/student/surveys/${assignmentId}/save-draft`,
        buildAnswersPayload()
      );
      setNotification({
        type: 'success',
        message: result?.message || 'Đã lưu bản nháp thành công.',
      });
    } catch (error) {
      setNotification({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSurvey = async () => {
    setSubmitting(true);
    try {
      const result = await axiosClient.post(
        `/student/surveys/${assignmentId}/submit`,
        buildAnswersPayload()
      );
      setShowSubmitModal(false);
      setNotification({
        type: 'success',
        message: result?.message || 'Nộp khảo sát thành công.',
      });
      window.setTimeout(() => navigate('/student/surveys'), 1800);
    } catch (error) {
      setShowSubmitModal(false);
      setNotification({ type: 'error', message: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || loadedAssignmentId !== (assignmentId ?? null);
  const isCompleted = survey?.status === 'completed';

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Đang tải dữ liệu khảo sát...
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertCircle className="mx-auto text-rose-600" size={28} />
        <p className="mt-3 text-sm font-semibold text-rose-800">Không thể tải khảo sát</p>
        <p className="mt-1 text-xs text-rose-700">
          {loadError || 'Không tìm thấy thông tin khảo sát.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/student/surveys')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const formattedDeadline =
    deadline && !Number.isNaN(new Date(deadline).getTime())
      ? new Date(deadline).toLocaleString('vi-VN')
      : 'Chưa có thông tin';

  return (
    <div className="space-y-6 pb-20">
      {notification && (
        <div
          role="status"
          className={`fixed right-6 top-20 z-50 flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg ${
            notification.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
        <div>
          <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-700">
            MÃ LHP: {survey.section_code}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {survey.course_name}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
              <User size={18} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Giảng viên giảng dạy</p>
              <p className="text-xs font-bold text-slate-800">
                {survey.lecturer_name || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-700">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Học kỳ áp dụng</p>
              <p className="text-xs font-bold text-slate-800">
                {[survey.term_name, survey.academic_year].filter(Boolean).join(' · ') ||
                  'Chưa cập nhật'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-900">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>
            <strong>Thời hạn đóng khảo sát:</strong> {formattedDeadline}
          </span>
        </div>

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
            <span>Tiến độ</span>
            <span>{progress.total} câu hỏi</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-100/80 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#08245f] text-xs font-bold text-white">
              {progress.total}
            </span>
            <h2 className="text-sm font-bold text-slate-900">Câu hỏi khảo sát</h2>
          </div>
          <span className="text-xs font-semibold text-rose-500">Câu có dấu * là bắt buộc</span>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            Khảo sát này chưa có câu hỏi.
          </div>
        ) : (
          questions.map((question, index) => {
            const value = answers[question.question_id];
            const answered = isQuestionAnswered(question, value);
            const isRating = question.question_type === 'rating';
            const isSingleChoice = question.question_type === 'single_choice';
            const isMultipleChoice = question.question_type === 'multiple_choice';
            const options = getQuestionOptions(question.options_json);
            const minRating = Number(question.min_value ?? 1);
            const maxRating = Number(question.max_value ?? 5);
            const ratings =
              Number.isFinite(minRating) &&
              Number.isFinite(maxRating) &&
              maxRating >= minRating &&
              maxRating - minRating <= 20
                ? Array.from(
                    { length: Math.floor(maxRating - minRating) + 1 },
                    (_, ratingIndex) => minRating + ratingIndex
                  )
                : [];

            return (
              <div
                key={question.question_id}
                className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    CÂU {question.display_order || index + 1}
                    {question.is_required && ' *'}
                  </span>
                  {answered && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Check size={13} />
                      Đã trả lời
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800">
                  {question.question_text}
                  {question.is_required && <span className="ml-1 text-rose-500">*</span>}
                </p>

                {isRating && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {ratings.map((rating) => {
                      const option = LIKERT_OPTIONS.find(
                        (item) => item.value === rating
                      );
                      const selected = Number(value) === rating;
                      return (
                        <button
                          key={rating}
                          type="button"
                          disabled={isCompleted}
                          onClick={() => updateAnswer(question.question_id, rating)}
                          className={`flex h-full flex-col items-center justify-center rounded-xl border p-3 text-center transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            selected
                              ? 'border-[#08245f] bg-[#08245f] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-base font-bold">{rating}</span>
                          <span
                            className={`mt-1 text-[11px] leading-tight ${
                              selected ? 'font-medium text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {option?.label || rating}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {(isSingleChoice || isMultipleChoice) && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {options.map((option) => {
                      const selected = isMultipleChoice
                        ? (Array.isArray(value) ? value : []).includes(option.value)
                        : value === option.value;
                      return (
                        <button
                          key={String(option.value)}
                          type="button"
                          disabled={isCompleted}
                          onClick={() => {
                            if (isSingleChoice) {
                              updateAnswer(question.question_id, option.value);
                              return;
                            }
                            const current = Array.isArray(value) ? value : [];
                            updateAnswer(
                              question.question_id,
                              selected
                                ? current.filter((item) => item !== option.value)
                                : [...current, option.value]
                            );
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            selected
                              ? 'border-blue-200 bg-blue-50/40 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                              isSingleChoice ? 'rounded-full' : 'rounded'
                            } ${
                              selected
                                ? 'border-[#08245f] bg-[#08245f] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && <Check size={11} strokeWidth={3} />}
                          </span>
                          {option.label}
                        </button>
                      );
                    })}
                    {options.length === 0 && (
                      <p className="text-xs text-slate-500">
                        Câu hỏi chưa có lựa chọn.
                      </p>
                    )}
                  </div>
                )}

                {question.question_type === 'text' && (
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={value || ''}
                    disabled={isCompleted}
                    onChange={(event) =>
                      updateAnswer(question.question_id, event.target.value)
                    }
                    placeholder="Nhập ý kiến của bạn..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                )}

                {!['rating', 'single_choice', 'multiple_choice', 'text'].includes(
                  question.question_type
                ) && (
                  <p className="text-xs text-rose-600">
                    Loại câu hỏi “{question.question_type}” chưa được hỗ trợ.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {isCompleted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={15} />
          Khảo sát này đã được hoàn thành.
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/student/surveys')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          <span>Quay lại danh sách</span>
        </button>

        {!isCompleted && (
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Save size={14} className="text-slate-500" />
              <span>{saving ? 'Đang lưu...' : 'Lưu bản nháp'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting || questions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#08245f] px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#0b3387] disabled:opacity-60"
            >
              <span>Gửi khảo sát</span>
              <Send size={13} />
            </button>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#08245f]">
              <Send size={24} />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              Xác nhận nộp phiếu khảo sát?
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Bạn đang nộp đánh giá cho học phần{' '}
              <strong className="text-slate-800">{survey.course_name}</strong>. Sau khi nộp,
              phiếu khảo sát sẽ được khóa.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitSurvey}
                disabled={submitting}
                className="rounded-xl bg-[#08245f] px-5 py-2 text-xs font-bold text-white hover:bg-[#0b3387] disabled:opacity-60"
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
