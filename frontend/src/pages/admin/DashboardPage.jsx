import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import {
  Activity,
  BookOpenCheck,
  ClipboardList,
  MessageSquareText,
  RefreshCw,
  Users,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const EMPTY_LIST = [];

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || error.message || fallback;

const unwrapData = (result) => result?.data ?? result;

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa cập nhật';

const CAMPAIGN_STATUS = {
  open: { label: 'Đang mở', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  closed: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  scheduled: { label: 'Sắp diễn ra', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  draft: { label: 'Bản nháp', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
};

function MetricCard({ title, value, detail, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{detail}</p>
    </article>
  );
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState(EMPTY_LIST);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaignLoading, setCampaignLoading] = useState(true);
  const [campaignError, setCampaignError] = useState('');
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    axiosClient
      .get('/admin/survey-campaigns/')
      .then((response) => {
        const result = unwrapData(response);
        if (!Array.isArray(result)) {
          throw new Error('Danh sách đợt khảo sát không đúng định dạng.');
        }
        if (!active) return;
        setCampaigns(result);
        setSelectedCampaignId((current) => {
          if (current && result.some((campaign) => String(campaign.campaign_id) === current)) {
            return current;
          }
          const preferredCampaign = result.find((campaign) => campaign.status === 'open') || result[0];
          return preferredCampaign ? String(preferredCampaign.campaign_id) : '';
        });
      })
      .catch((error) => {
        if (active) setCampaignError(getErrorMessage(error, 'Không thể tải danh sách đợt khảo sát.'));
      })
      .finally(() => {
        if (active) setCampaignLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let active = true;

    axiosClient
      .get('/admin/dashboard/feedback-summary')
      .then((response) => {
        const result = unwrapData(response);
        if (!result || !Array.isArray(result.items)) {
          throw new Error('Dữ liệu phản hồi không đúng định dạng.');
        }
        if (active) setFeedback(result);
      })
      .catch((error) => {
        if (active) setFeedbackError(getErrorMessage(error, 'Không thể tải tổng hợp phản hồi.'));
      })
      .finally(() => {
        if (active) setFeedbackLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedCampaignId) return undefined;

    let active = true;
    const query = `?campaign_id=${encodeURIComponent(selectedCampaignId)}`;

    Promise.all([
      axiosClient.get(`/admin/dashboard/overview${query}`),
      axiosClient.get(`/admin/dashboard/survey-progress${query}`),
    ])
      .then(([overviewResponse, progressResponse]) => {
        const overviewResult = unwrapData(overviewResponse);
        const progressResult = unwrapData(progressResponse);
        if (
          !overviewResult ||
          typeof overviewResult.total_assignments !== 'number' ||
          !progressResult ||
          !Array.isArray(progressResult.by_faculties)
        ) {
          throw new Error('Dữ liệu tổng quan khảo sát không đúng định dạng.');
        }
        if (!active) return;
        setStats({
          campaignId: selectedCampaignId,
          overview: overviewResult,
          progress: progressResult,
        });
      })
      .catch((error) => {
        if (active) {
          setStats({
            campaignId: selectedCampaignId,
            error: getErrorMessage(error, 'Không thể tải thống kê khảo sát.'),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCampaignId, reloadKey]);

  const selectedCampaign = campaigns.find(
    (campaign) => String(campaign.campaign_id) === selectedCampaignId
  );
  const currentStats = stats?.campaignId === selectedCampaignId ? stats : null;
  const overview = currentStats?.overview;
  const progress = currentStats?.progress;
  const statsError = currentStats?.error || '';
  const statsLoading = Boolean(selectedCampaignId) && !currentStats;

  const feedbackItems = useMemo(() => {
    return [...(feedback?.items ?? EMPTY_LIST)].sort(
      (first, second) => second.total_feedback - first.total_feedback
    );
  }, [feedback]);

  const chartData = useMemo(() => {
    const faculties = progress?.by_faculties ?? EMPTY_LIST;
    return {
      labels: faculties.map((faculty) => faculty.faculty_name),
      datasets: [
        {
          label: 'Đã hoàn thành',
          data: faculties.map((faculty) => faculty.completed),
          backgroundColor: '#0b2b70',
          borderRadius: 5,
          barThickness: 15,
        },
        {
          label: 'Chưa hoàn thành',
          data: faculties.map((faculty) => Math.max(faculty.total - faculty.completed, 0)),
          backgroundColor: '#dce7fb',
          borderRadius: 5,
          barThickness: 15,
        },
      ],
    };
  }, [progress]);

  const chartOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 16 },
        },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          grid: { color: '#edf1f7' },
          ticks: { precision: 0, color: '#64748b', font: { size: 10 } },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#475569', font: { size: 10 } },
        },
      },
    }),
    []
  );

  const completionRate = overview?.completion_rate ?? 0;
  const recentCampaigns = campaigns.slice(0, 5);

  const handleRefresh = () => {
    setCampaignLoading(true);
    setCampaignError('');
    setFeedbackError('');
    setFeedbackLoading(true);
    setStats(null);
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      

      {(campaignError || statsError) && (
        <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center">
          <span>{campaignError || statsError}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Thử tải lại
          </button>
        </div>
      )}

      <section aria-label="Chỉ số khảo sát" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Lượt khảo sát được giao"
          value={statsLoading ? '...' : statsError ? '—' : formatNumber(overview?.total_assignments)}
          detail={selectedCampaign?.campaign_name || 'Tổng lượt khảo sát trong đợt'}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          title="Đã hoàn thành"
          value={statsLoading ? '...' : statsError ? '—' : formatNumber(overview?.completed_assignments)}
          detail="Sinh viên đã gửi phản hồi"
          icon={BookOpenCheck}
          tone="green"
        />
        <MetricCard
          title="Đang thực hiện"
          value={statsLoading ? '...' : statsError ? '—' : formatNumber(overview?.in_progress_assignments)}
          detail={`${formatNumber(overview?.not_started_assignments)} lượt chưa bắt đầu`}
          icon={ClipboardList}
          tone="amber"
        />
        <MetricCard
          title="Tỷ lệ hoàn thành"
          value={statsLoading ? '...' : statsError ? '—' : `${completionRate.toLocaleString('vi-VN')}%`}
          detail="Tiến độ của đợt khảo sát đã chọn"
          icon={Activity}
          tone="violet"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="font-bold text-slate-900">Tiến độ khảo sát theo khoa</h2>
              <p className="mt-1 text-xs text-slate-500">
                So sánh số lượt đã hoàn thành và chưa hoàn thành.
              </p>
            </div>
            {progress?.campaign_name && (
              <span className="max-w-full truncate rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                {progress.campaign_name}
              </span>
            )}
          </div>
          <div className="mt-4 min-h-64 sm:min-h-80">
            {statsLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Đang tải biểu đồ...
              </div>
            ) : statsError ? (
              <div className="flex h-64 items-center justify-center rounded-xl bg-rose-50 px-5 text-center text-sm text-rose-700">
                Không thể tải dữ liệu biểu đồ.
              </div>
            ) : chartData.labels.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 px-5 text-center text-sm text-slate-500">
                {selectedCampaign
                  ? 'Chưa có dữ liệu tiến độ theo khoa cho đợt khảo sát này.'
                  : 'Chưa có đợt khảo sát để hiển thị tiến độ.'}
              </div>
            )}
          </div>
          {progress?.by_faculties?.length > 0 && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-xs">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="px-2 py-2 font-semibold">Khoa</th>
                    <th className="px-2 py-2 text-right font-semibold">Hoàn thành</th>
                    <th className="px-2 py-2 text-right font-semibold">Tổng lượt</th>
                    <th className="px-2 py-2 text-right font-semibold">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.by_faculties.map((faculty) => (
                    <tr key={faculty.faculty_name} className="border-b border-slate-50 last:border-0">
                      <td className="max-w-56 truncate px-2 py-2.5 font-medium text-slate-700">
                        {faculty.faculty_name}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-600">
                        {formatNumber(faculty.completed)}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-600">
                        {formatNumber(faculty.total)}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold text-emerald-700">
                        {Number(faculty.rate || 0).toLocaleString('vi-VN')}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Phản hồi văn bản</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Tổng hợp ý kiến tự luận và các môn học có nhiều phản hồi.
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquareText size={19} />
            </span>
          </div>
          {feedbackError ? (
            <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {feedbackError}
            </p>
          ) : (
            <>
              <div className="mt-5 rounded-xl bg-[#f3f6fc] p-4">
                <p className="text-xs font-medium text-slate-500">Tổng ý kiến đã ghi nhận</p>
                <p className="mt-1 text-3xl font-extrabold text-[#08245f]">
                  {statsLoading ? '...' : statsError ? '—' : formatNumber(overview?.total_text_feedback)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {feedbackItems.length} môn học đang có dữ liệu phản hồi
                </p>
              </div>
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">Môn học nổi bật</h3>
                  {(statsLoading || feedbackLoading) && (
                    <span className="text-xs text-slate-400">Đang tải...</span>
                  )}
                </div>
                {feedbackItems.length > 0 ? (
                  <ul className="space-y-3">
                    {feedbackItems.slice(0, 5).map((item) => {
                      const largestCount = Math.max(feedbackItems[0].total_feedback, 1);
                      const width = Math.min((item.total_feedback / largestCount) * 100, 100);
                      return (
                        <li key={item.course_code}>
                          <div className="flex items-start justify-between gap-3 text-xs">
                            <span className="min-w-0">
                              <span className="block truncate font-semibold text-slate-700">
                                {item.course_name}
                              </span>
                              <span className="text-slate-400">{item.course_code}</span>
                            </span>
                            <span className="shrink-0 font-semibold text-slate-600">
                              {formatNumber(item.total_feedback)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0b2b70]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa có dữ liệu phản hồi văn bản.
                  </p>
                )}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div>
            <h2 className="font-bold text-slate-900">Các đợt khảo sát gần đây</h2>
            <p className="mt-1 text-xs text-slate-500">
              Danh sách đợt khảo sát mới nhất trong hệ thống.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {formatNumber(campaigns.length)} đợt khảo sát
          </span>
        </div>
        {campaignLoading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Đang tải danh sách đợt khảo sát...
          </div>
        ) : recentCampaigns.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Chưa có đợt khảo sát nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên đợt khảo sát</th>
                  <th className="px-5 py-3 font-semibold">Thời gian</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-semibold">Lượt hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCampaigns.map((campaign) => {
                  const status = CAMPAIGN_STATUS[campaign.status] || {
                    label: campaign.status || 'Chưa xác định',
                    className: 'bg-slate-100 text-slate-600 ring-slate-200',
                  };
                  const isSelected = String(campaign.campaign_id) === selectedCampaignId;
                  return (
                    <tr
                      key={campaign.campaign_id}
                      className={isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                    >
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaignId(String(campaign.campaign_id))}
                          className="max-w-sm text-left font-semibold text-slate-800 hover:text-blue-800"
                        >
                          {campaign.campaign_name}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                        {formatDate(campaign.start_survey_campaigns)} –{' '}
                        {formatDate(campaign.end_survey_campaigns)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-semibold text-slate-700">
                        {isSelected && overview
                          ? `${formatNumber(overview.completed_assignments)} / ${formatNumber(overview.total_assignments)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}