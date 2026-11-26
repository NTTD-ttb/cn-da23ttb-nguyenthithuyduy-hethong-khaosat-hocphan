import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axiosClient from '../../api/axiosClient';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

const SENTIMENT_LABELS = {
  positive: 'Tích cực',
  neutral: 'Trung tính',
  negative: 'Tiêu cực',
};

const TOPIC_SUGGESTIONS = {
  content: 'Rà soát mức độ phù hợp, trình tự và khối lượng nội dung học phần.',
  teaching: 'Xem lại cách giải thích, nhịp độ giảng dạy và mức độ tương tác trên lớp.',
  material: 'Cập nhật slide, tài liệu tham khảo và hướng dẫn tự học.',
  assignment: 'Rà soát khối lượng, độ rõ yêu cầu và thời hạn bài tập.',
  practice: 'Kiểm tra thời lượng thực hành, thiết bị và hướng dẫn trong phòng lab.',
  assessment: 'Đối chiếu nội dung ôn tập, hình thức kiểm tra và tiêu chí chấm điểm.',
  other: 'Đọc các nhận xét tiêu biểu để xác định vấn đề cụ thể cần xử lý.',
};

const PAGE_SIZE = 20;
const MIN_RECOMMENDATION_MENTIONS = 5;

function getList(response) {
  return Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getSentimentColor(code) {
  return SENTIMENT_COLORS[code] || '#94a3b8';
}

function ConfidenceBar({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-slate-400">Chưa có</span>;
  }
  const percentage = Math.max(0, Math.min(100, Number(value) * 100));
  return (
    <div className="flex min-w-24 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-10 text-right text-[11px] font-semibold text-slate-600">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function NlpAnalysisPage() {
  const [terms, setTerms] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [feedback, setFeedback] = useState({ total: 0, items: [] });
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const feedbackRef = useRef(null);

  const campaignsForTerm = useMemo(
    () => campaigns.filter((campaign) => String(campaign.term_id) === String(selectedTermId)),
    [campaigns, selectedTermId]
  );

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => String(campaign.campaign_id) === String(selectedCampaignId)),
    [campaigns, selectedCampaignId]
  );

  useEffect(() => {
    let active = true;
    const loadFilters = async () => {
      setLoadingOptions(true);
      setError('');
      try {
        const [termsResponse, campaignsResponse] = await Promise.all([
          axiosClient.get('/admin/academic-terms/?limit=500'),
          axiosClient.get('/admin/survey-campaigns/?limit=500'),
        ]);
        if (!active) return;
        const nextTerms = getList(termsResponse);
        const nextCampaigns = getList(campaignsResponse);
        setTerms(nextTerms);
        setCampaigns(nextCampaigns);
        if (nextCampaigns.length > 0) {
          const firstCampaign = nextCampaigns[0];
          setSelectedTermId(String(firstCampaign.term_id));
          setSelectedCampaignId(String(firstCampaign.campaign_id));
        }
      } catch (requestError) {
        if (active) {
          console.error('Không thể tải bộ lọc phân tích NLP:', requestError);
          setError(requestError.response?.data?.detail || 'Không thể tải học kỳ và đợt khảo sát.');
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    };
    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCampaignId) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingAnalytics(true);
      setError('');
      const params = { campaign_id: Number(selectedCampaignId) };
      if (selectedCourseId) params.course_id = Number(selectedCourseId);

      axiosClient
        .get('/admin/nlp/analytics', { params })
        .then((response) => {
          if (!active) return;
          setAnalytics(response);
          if (!selectedCourseId) setCourseOptions(response.courses || []);
        })
        .catch((requestError) => {
          if (!active) return;
          console.error('Không thể tải thống kê NLP:', requestError);
          setError(requestError.response?.data?.detail || 'Không thể tải dữ liệu phân tích.');
          setAnalytics(null);
        })
        .finally(() => {
          if (active) setLoadingAnalytics(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedCampaignId, selectedCourseId, refreshKey]);

  useEffect(() => {
    if (!selectedCampaignId) return undefined;

    let active = true;
    const timer = window.setTimeout(() => {
      setLoadingFeedback(true);
      const params = {
        campaign_id: Number(selectedCampaignId),
        skip: feedbackPage * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (selectedCourseId) params.course_id = Number(selectedCourseId);
      if (sentimentFilter) params.sentiment = sentimentFilter;
      if (topicFilter) params.topic = topicFilter;
      if (feedbackSearch.trim()) params.search = feedbackSearch.trim();

      axiosClient
        .get('/admin/nlp/feedback-search', { params })
        .then((response) => {
          if (active) setFeedback(response);
        })
        .catch((requestError) => {
          if (!active) return;
          console.error('Không thể tải danh sách nhận xét:', requestError);
          setError(requestError.response?.data?.detail || 'Không thể tải danh sách nhận xét.');
          setFeedback({ total: 0, items: [] });
        })
        .finally(() => {
          if (active) setLoadingFeedback(false);
        });
    }, feedbackSearch.trim() ? 300 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    selectedCampaignId,
    selectedCourseId,
    sentimentFilter,
    topicFilter,
    feedbackSearch,
    feedbackPage,
    refreshKey,
  ]);

  const handleTermChange = (termId) => {
    setSelectedTermId(termId);
    const nextCampaign = campaigns.find((campaign) => String(campaign.term_id) === termId);
    setSelectedCampaignId(nextCampaign ? String(nextCampaign.campaign_id) : '');
    setSelectedCourseId('');
    setFeedbackPage(0);
  };

  const handleCampaignChange = (campaignId) => {
    setSelectedCampaignId(campaignId);
    setSelectedCourseId('');
    setFeedbackPage(0);
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setFeedbackPage(0);
  };

  const handleRunAnalysis = async () => {
    if (!selectedCampaignId) return;
    setAnalyzing(true);
    setNotice('');
    setError('');
    try {
      const result = await axiosClient.post(`/admin/nlp/batch-analyze/${selectedCampaignId}`);
      setNotice(
        `Đã phân tích ${result.successfully_processed} phản hồi mới trên ${result.total_unprocessed} phản hồi đang chờ.`
      );
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      console.error('Không thể chạy phân tích NLP:', requestError);
      setError(requestError.response?.data?.detail || 'Không thể chạy phân tích NLP.');
    } finally {
      setAnalyzing(false);
    }
  };

  const sentimentDetails = analytics?.sentiment_details || [];
  const topicDetails = analytics?.topic_details || [];
  const negativeRate =
    sentimentDetails.find((item) => item.sentiment_code === 'negative')?.percentage || 0;
  const negativeTopics = useMemo(
    () =>
      (analytics?.topic_sentiments || [])
        .map((topic) => {
          const negative = topic.details.find((item) => item.sentiment_code === 'negative');
          return {
            ...topic,
            negative_count: negative?.count || 0,
            negative_percentage: negative?.percentage || 0,
          };
        })
        .filter(
          (topic) =>
            topic.total_mentions >= MIN_RECOMMENDATION_MENTIONS &&
            topic.negative_percentage >= 30
        )
        .sort((a, b) => b.negative_percentage - a.negative_percentage)
        .slice(0, 3),
    [analytics]
  );

  const doughnutData = {
    labels: sentimentDetails.map((item) => SENTIMENT_LABELS[item.sentiment_code] || item.sentiment_name),
    datasets: [
      {
        data: sentimentDetails.map((item) => item.count),
        backgroundColor: sentimentDetails.map((item) => getSentimentColor(item.sentiment_code)),
        borderColor: '#ffffff',
        borderWidth: 3,
      },
    ],
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 18 } },
      tooltip: {
        callbacks: {
          label(context) {
            const item = sentimentDetails[context.dataIndex];
            return ` ${context.label}: ${item?.count || 0} (${formatPercent(item?.percentage)})`;
          },
        },
      },
    },
  };

  const topicBarData = {
    labels: topicDetails.map((item) => item.topic_name),
    datasets: [
      {
        label: 'Lượt đề cập',
        data: topicDetails.map((item) => item.count),
        backgroundColor: '#3159a6',
        borderRadius: 7,
        maxBarThickness: 26,
      },
    ],
  };
  const topicBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(context) {
            const item = topicDetails[context.dataIndex];
            return ` ${item?.count || 0} lượt (${formatPercent(item?.percentage)})`;
          },
        },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eef2f7' } },
      y: { grid: { display: false } },
    },
  };

  const currentPageCount = feedback.items?.length || 0;
  const pageCount = Math.max(1, Math.ceil((feedback.total || 0) / PAGE_SIZE));
  const isSelectedCourse = Boolean(selectedCourseId);
  const displayedCourses = isSelectedCourse
    ? courseOptions.filter((course) => String(course.course_id) === selectedCourseId)
    : courseOptions;

  return (
    <div className="space-y-6 pb-10">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#002060] via-[#083082] to-[#0b3d9f] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <BrainCircuit size={25} className="text-amber-300" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  Phân tích phản hồi khảo sát
                </h1>
                <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-200">
                  NLP • AI
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Khám phá cảm xúc, chủ đề và ý kiến của sinh viên theo từng học kỳ, đợt khảo sát và học phần.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={!selectedCampaignId || analyzing || loadingAnalytics}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={analyzing ? 'animate-spin' : ''} />
            {analyzing ? 'Đang phân tích phản hồi...' : 'Phân tích phản hồi mới'}
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <Sparkles size={18} className="mt-0.5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
          <Filter size={15} />
          Phạm vi phân tích
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Học kỳ</span>
            <select
              value={selectedTermId}
              onChange={(event) => handleTermChange(event.target.value)}
              disabled={loadingOptions}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Chọn học kỳ</option>
              {terms.map((term) => (
                <option key={term.term_id} value={term.term_id}>
                  {term.term_name} ({term.academic_year})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Đợt khảo sát</span>
            <select
              value={selectedCampaignId}
              onChange={(event) => handleCampaignChange(event.target.value)}
              disabled={loadingOptions || campaignsForTerm.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Chọn đợt khảo sát</option>
              {campaignsForTerm.map((campaign) => (
                <option key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.campaign_name} · {campaign.status === 'open' ? 'Đang mở' : campaign.status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Học phần</span>
            <select
              value={selectedCourseId}
              onChange={(event) => handleCourseChange(event.target.value)}
              disabled={!selectedCampaignId || courseOptions.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả học phần</option>
              {courseOptions.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} · {course.course_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedCampaign && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-800">
              {terms.find((term) => String(term.term_id) === String(selectedCampaign.term_id))?.term_name || 'Học kỳ'}
            </span>
            <span>{selectedCampaign.campaign_name}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
              {selectedCampaign.status}
            </span>
            {isSelectedCourse && (
              <button
                type="button"
                onClick={() => handleCourseChange('')}
                className="font-bold text-blue-700 hover:text-blue-900"
              >
                Xóa lọc học phần
              </button>
            )}
          </div>
        )}
      </section>

      {loadingOptions ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Đang tải học kỳ và đợt khảo sát...
        </div>
      ) : !selectedCampaignId ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <MessageSquareText size={32} className="mx-auto text-slate-300" />
          <h2 className="mt-3 text-base font-bold text-slate-800">Chưa có đợt khảo sát để phân tích</h2>
          <p className="mt-1 text-sm text-slate-500">
            Hãy tạo đợt khảo sát và thu thập phản hồi trước khi xem thống kê NLP.
          </p>
        </div>
      ) : loadingAnalytics && !analytics ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Đang tổng hợp kết quả phân tích...
        </div>
      ) : analytics ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Nhận xét văn bản</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{analytics.total_comments}</p>
              <p className="mt-1 text-[11px] text-slate-400">Trong phạm vi đã chọn</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-800">Đã phân tích</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">{analytics.analyzed_comments}</p>
              <p className="mt-1 text-[11px] text-emerald-700/70">
                {analytics.total_comments
                  ? formatPercent((analytics.analyzed_comments / analytics.total_comments) * 100)
                  : '0%'}{' '}
                số nhận xét
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
              <p className="text-xs font-semibold text-amber-800">Chờ phân tích</p>
              <p className="mt-2 text-2xl font-black text-amber-700">{analytics.pending_comments}</p>
              <p className="mt-1 text-[11px] text-amber-700/70">Có thể chạy phân tích ở phía trên</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
              <p className="text-xs font-semibold text-rose-800">Phản hồi tiêu cực</p>
              <p className="mt-2 text-2xl font-black text-rose-700">{formatPercent(negativeRate)}</p>
              <p className="mt-1 text-[11px] text-rose-700/70">Tính trên các kết quả có nhãn cảm xúc</p>
            </div>
          </section>

          {analytics.analyzed_comments === 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
              Chưa có phản hồi văn bản nào được phân tích. Nhấn <strong>Phân tích phản hồi mới</strong> để chạy NLP.
            </div>
          ) : (
            <>
              <section className="grid gap-5 xl:grid-cols-2">
                <Panel
                  title="Phân bố cảm xúc"
                  subtitle="Tỷ lệ cảm xúc trong các nhận xét đã được phân tích."
                  icon={BarChart3}
                >
                  <div className="relative mx-auto h-72 max-w-md">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                      <p className="text-2xl font-black text-slate-900">{analytics.analyzed_comments}</p>
                      <p className="text-[11px] font-semibold text-slate-500">đã phân tích</p>
                    </div>
                  </div>
                </Panel>

                <Panel
                  title="Chủ đề được phản ánh"
                  subtitle="Lượt đề cập theo chủ đề; một nhận xét có thể mang nhiều nhãn."
                  icon={MessageSquareText}
                >
                  <div className="h-72">
                    {topicDetails.length > 0 ? (
                      <Bar data={topicBarData} options={topicBarOptions} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Chưa có dữ liệu chủ đề.
                      </div>
                    )}
                  </div>
                </Panel>
              </section>

              <Panel
                title="Ma trận cảm xúc theo chủ đề"
                subtitle="Phần trăm được tính trong từng chủ đề. Di chuột/đọc từng ô để so sánh số lượng."
                icon={Filter}
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-3">Chủ đề</th>
                        <th className="px-3 py-3 text-center text-emerald-700">Tích cực</th>
                        <th className="px-3 py-3 text-center text-amber-700">Trung tính</th>
                        <th className="px-3 py-3 text-center text-rose-700">Tiêu cực</th>
                        <th className="px-3 py-3 text-right">Lượt đề cập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.topic_sentiments.map((topic) => (
                        <tr key={topic.topic_code} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-semibold text-slate-800">{topic.topic_name}</td>
                          {['positive', 'neutral', 'negative'].map((code) => {
                            const value = topic.details.find((item) => item.sentiment_code === code);
                            return (
                              <td key={code} className="px-3 py-2 text-center">
                                <span
                                  className="inline-flex min-w-24 flex-col rounded-lg px-3 py-2"
                                  style={{
                                    backgroundColor:
                                      code === 'positive'
                                        ? 'rgba(16, 185, 129, 0.10)'
                                        : code === 'neutral'
                                        ? 'rgba(245, 158, 11, 0.12)'
                                        : 'rgba(239, 68, 68, 0.10)',
                                  }}
                                >
                                  <strong className="text-sm text-slate-800">
                                    {formatPercent(value?.percentage)}
                                  </strong>
                                  <span className="mt-0.5 text-[10px] text-slate-500">
                                    {value?.count || 0} nhận xét
                                  </span>
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-right font-bold text-slate-700">
                            {topic.total_mentions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}

          <Panel
            title={isSelectedCourse ? 'Tóm tắt học phần đã chọn' : 'So sánh các học phần'}
            subtitle="Chọn một học phần để lọc biểu đồ, nhận xét và phản hồi liên quan đến giảng viên."
            icon={BarChart3}
          >
            {courseOptions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Chưa có nhận xét văn bản thuộc các học phần trong đợt khảo sát này.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Học phần</th>
                      <th className="px-3 py-3">Giảng viên</th>
                      <th className="px-3 py-3 text-center">Nhận xét</th>
                      <th className="px-3 py-3">Cảm xúc</th>
                      <th className="px-3 py-3">Chủ đề nổi bật</th>
                      <th className="px-3 py-3 text-right">Tiêu cực</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedCourses.map((course) => {
                      const sentimentTotal = Object.values(course.sentiment_counts || {}).reduce(
                        (total, count) => total + count,
                        0
                      );
                      return (
                        <tr
                          key={course.course_id}
                          onClick={() => handleCourseChange(String(course.course_id))}
                          className={`cursor-pointer transition hover:bg-blue-50/60 ${
                            String(course.course_id) === selectedCourseId ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-3 py-3">
                            <span className="block font-extrabold text-[#002060]">{course.course_code}</span>
                            <span className="mt-0.5 block text-slate-600">{course.course_name}</span>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {(course.lecturers || []).join(', ') || 'Chưa có dữ liệu'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <strong className="text-slate-800">{course.analyzed_comments}</strong>
                            <span className="text-slate-400"> / {course.total_comments}</span>
                          </td>
                          <td className="min-w-48 px-3 py-3">
                            <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                              {['positive', 'neutral', 'negative'].map((code) => {
                                const count = course.sentiment_counts?.[code] || 0;
                                const width = sentimentTotal ? (count / sentimentTotal) * 100 : 0;
                                return (
                                  <span
                                    key={code}
                                    title={`${SENTIMENT_LABELS[code]}: ${count}`}
                                    style={{ width: `${width}%`, backgroundColor: getSentimentColor(code) }}
                                  />
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {(course.top_topics || []).slice(0, 2).map((topic) => topic.topic_name).join(', ') || '—'}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-rose-700">
                            {formatPercent(course.negative_percentage)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {isSelectedCourse && analytics.course_lecturers?.length > 0 && (
            <Panel
              title="Phản hồi liên quan đến giảng viên"
              subtitle="Tổng hợp theo các nhận xét thuộc chủ đề giảng dạy trong những lớp của học phần này; đây là tín hiệu tham khảo, không phải đánh giá cá nhân tuyệt đối."
              icon={TrendingDown}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {analytics.course_lecturers.map((lecturer) => (
                  <div
                    key={`${lecturer.course_id}-${lecturer.lecturer_id}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-bold text-slate-900">{lecturer.lecturer_name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {lecturer.course_code} · {lecturer.teaching_comments} nhận xét về giảng dạy
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Tiêu cực trong chủ đề giảng dạy</span>
                      <strong className="text-rose-700">{formatPercent(lecturer.teaching_negative_percentage)}</strong>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lecturer.top_topics?.slice(0, 3).map((topic) => (
                        <span
                          key={topic.topic_code}
                          className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
                        >
                          {topic.topic_name} · {topic.count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel
            title="Gợi ý cần xem xét"
            subtitle={`Gợi ý theo chủ đề có ít nhất ${MIN_RECOMMENDATION_MENTIONS} lượt đề cập và tỷ lệ tiêu cực từ 30%. Hãy đọc nhận xét gốc trước khi quyết định.`}
            icon={Sparkles}
          >
            {negativeTopics.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {negativeTopics.map((topic) => (
                  <article key={topic.topic_code} className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-slate-900">{topic.topic_name}</h3>
                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-extrabold text-rose-700">
                        {formatPercent(topic.negative_percentage)} tiêu cực
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {TOPIC_SUGGESTIONS[topic.topic_code] || TOPIC_SUGGESTIONS.other}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      {topic.negative_count} phản hồi tiêu cực / {topic.total_mentions} lượt đề cập
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTopicFilter(topic.topic_code);
                        setFeedbackPage(0);
                        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="mt-3 text-xs font-bold text-blue-800 hover:text-blue-950"
                    >
                      Xem nhận xét làm căn cứ →
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                {analytics.analyzed_comments < MIN_RECOMMENDATION_MENTIONS
                  ? 'Chưa đủ nhận xét đã phân tích để đưa ra gợi ý đáng tin cậy.'
                  : 'Chưa có chủ đề nào vượt ngưỡng cảnh báo hiện tại.'}
              </div>
            )}
          </Panel>

          <section ref={feedbackRef} className="scroll-mt-5">
            <Panel
              title="Nhận xét văn bản đã phân tích"
              subtitle="Nội dung được hiển thị ẩn danh; độ tin cậy là mức chắc chắn của mô hình, không phải mức độ hài lòng của sinh viên."
              icon={FileText}
            >
              <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <label className="relative block xl:col-span-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={feedbackSearch}
                    onChange={(event) => {
                      setFeedbackSearch(event.target.value);
                      setFeedbackPage(0);
                    }}
                    placeholder="Tìm trong nội dung nhận xét..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <select
                  value={sentimentFilter}
                  onChange={(event) => {
                    setSentimentFilter(event.target.value);
                    setFeedbackPage(0);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-700"
                >
                  <option value="">Tất cả cảm xúc</option>
                  {Object.entries(SENTIMENT_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
                <select
                  value={topicFilter}
                  onChange={(event) => {
                    setTopicFilter(event.target.value);
                    setFeedbackPage(0);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-700"
                >
                  <option value="">Tất cả chủ đề</option>
                  {topicDetails.map((topic) => (
                    <option key={topic.topic_code} value={topic.topic_code}>{topic.topic_name}</option>
                  ))}
                </select>
              </div>

              {loadingFeedback ? (
                <p className="py-8 text-center text-sm text-slate-500">Đang tải nhận xét...</p>
              ) : feedback.items?.length ? (
                <div className="space-y-3">
                  {feedback.items.map((item) => (
                    <article key={item.analysis_id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-800">
                            {item.course_code} · {item.course_name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.section_code} · {item.lecturer_name}
                          </span>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                          style={{
                            backgroundColor: `${getSentimentColor(
                              item.sentiment === 'Tích cực'
                                ? 'positive'
                                : item.sentiment === 'Trung tính'
                                ? 'neutral'
                                : item.sentiment === 'Tiêu cực'
                                ? 'negative'
                                : ''
                            )}1a`,
                            color: getSentimentColor(
                              item.sentiment === 'Tích cực'
                                ? 'positive'
                                : item.sentiment === 'Trung tính'
                                ? 'neutral'
                                : item.sentiment === 'Tiêu cực'
                                ? 'negative'
                                : ''
                            ),
                          }}
                        >
                          {item.sentiment}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {item.original_text}
                      </p>
                      <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-[minmax(180px,0.7fr)_1.3fr]">
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Độ tin cậy cảm xúc
                          </p>
                          <ConfidenceBar value={item.sentiment_confidence} />
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Chủ đề và độ tin cậy
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.topic_details?.length ? (
                              item.topic_details.map((topic) => (
                                <span
                                  key={topic.topic_code}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-900"
                                >
                                  {topic.topic_name}
                                  {topic.confidence !== null && topic.confidence !== undefined && (
                                    <span className="text-blue-600">{Math.round(topic.confidence * 100)}%</span>
                                  )}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Chưa gán chủ đề</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                  Không có nhận xét phù hợp với bộ lọc.
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-500">
                  {feedback.total} nhận xét · Trang {Math.min(feedbackPage + 1, pageCount)} / {pageCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={feedbackPage === 0 || loadingFeedback}
                    onClick={() => setFeedbackPage((page) => Math.max(0, page - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={feedbackPage + 1 >= pageCount || loadingFeedback || currentPageCount === 0}
                    onClick={() => setFeedbackPage((page) => page + 1)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  );
}