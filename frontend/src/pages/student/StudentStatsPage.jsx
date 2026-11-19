import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Printer,
  RotateCcw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const EMPTY_TERMS = [];

const getErrorMessage = (error) =>
  error.response?.data?.detail || error.message || 'Không thể tải thống kê khảo sát.';

export default function StudentStatsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/student/stats/summary')
      .then((data) => {
        if (!active) return;
        const result = data?.data || data;
        if (!result || !Array.isArray(result.by_terms)) {
          throw new Error('Dữ liệu thống kê học kỳ không hợp lệ.');
        }
        setSummary(result);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const terms = summary?.by_terms ?? EMPTY_TERMS;
  const filteredTerms = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('vi');
    return terms.filter((term) => {
      if (selectedTerm !== 'all' && String(term.term_id) !== selectedTerm) return false;
      if (!query) return true;
      return `${term.term_name} ${term.academic_year}`.toLocaleLowerCase('vi').includes(query);
    });
  }, [terms, searchTerm, selectedTerm]);

  const selectedTermStats =
    selectedTerm === 'all'
      ? null
      : terms.find((term) => String(term.term_id) === selectedTerm);
  const scopedTotal = selectedTermStats?.total_assigned ?? summary?.total_courses ?? 0;
  const scopedCompleted = selectedTermStats?.completed ?? summary?.total_completed ?? 0;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTerm('all');
  };

  const handleExportCertificate = (term) => {
    const certificateWindow = window.open('', '_blank', 'width=900,height=700');
    if (!certificateWindow) {
      window.alert('Trình duyệt đang chặn cửa sổ xuất chứng nhận. Vui lòng cho phép cửa sổ bật lên.');
      return;
    }

    const printDocument = certificateWindow.document;
    printDocument.title = `Chứng nhận khảo sát ${term.term_name}`;

    const style = printDocument.createElement('style');
    style.textContent = `
      body { margin: 0; padding: 48px; color: #0f172a; font: 15px Arial, sans-serif; }
      main { max-width: 760px; margin: 0 auto; border: 2px solid #08245f; padding: 42px; }
      h1 { margin: 0; color: #08245f; text-align: center; font-size: 24px; }
      .subtitle { margin: 12px 0 32px; color: #475569; text-align: center; }
      table { width: 100%; border-collapse: collapse; }
      td { border: 1px solid #cbd5e1; padding: 14px 16px; }
      td:first-child { width: 48%; background: #f8fafc; font-weight: 600; }
      .footer { margin-top: 32px; color: #64748b; font-size: 12px; text-align: center; }
      @media print { body { padding: 0; } main { border: 2px solid #08245f; } }
    `;
    printDocument.head.appendChild(style);

    const certificate = printDocument.createElement('main');
    const title = printDocument.createElement('h1');
    title.textContent = 'CHỨNG NHẬN THỐNG KÊ KHẢO SÁT';
    certificate.appendChild(title);

    const subtitle = printDocument.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = `Học kỳ ${term.term_name} · Năm học ${term.academic_year}`;
    certificate.appendChild(subtitle);

    const table = printDocument.createElement('table');
    [
      ['Tổng số môn được phân công', term.total_assigned],
      ['Số môn đã hoàn thành', term.completed],
      ['Số môn chưa hoàn thành', term.pending],
      ['Tỷ lệ hoàn thành', `${term.completion_rate}%`],
    ].forEach(([label, value]) => {
      const row = printDocument.createElement('tr');
      const labelCell = printDocument.createElement('td');
      labelCell.textContent = label;
      const valueCell = printDocument.createElement('td');
      valueCell.textContent = String(value);
      row.append(labelCell, valueCell);
      table.appendChild(row);
    });
    certificate.appendChild(table);

    const footer = printDocument.createElement('p');
    footer.className = 'footer';
    footer.textContent = `Xuất từ hệ thống thống kê khảo sát lúc ${new Intl.DateTimeFormat(
      'vi-VN',
      { dateStyle: 'long', timeStyle: 'short' }
    ).format(new Date())}.`;
    certificate.appendChild(footer);
    printDocument.body.appendChild(certificate);

    certificateWindow.focus();
    certificateWindow.setTimeout(() => {
      certificateWindow.print();
      certificateWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng số phiếu đã hoàn thành</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#08245f]">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? '—' : `${summary?.total_completed ?? 0} phiếu`}
            </span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Trên {summary?.total_courses ?? 0} lượt khảo sát được phân công
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {selectedTermStats
                ? `Tiến độ ${selectedTermStats.term_name}`
                : 'Tiến độ tất cả học kỳ'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpenCheck size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? '—' : `${scopedCompleted} / ${scopedTotal}`}
              <span className="ml-1 text-lg font-semibold text-slate-500">môn</span>
            </span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Số môn đã hoàn thành / được phân công
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tỷ lệ hoàn thành chung</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600">
              {loading ? '—' : `${summary?.overall_rate ?? 0}%`}
            </span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Tính trên tất cả học kỳ đã có phân công
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Số học kỳ có thống kê</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {loading ? '—' : `${terms.length} học kỳ`}
            </span>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-500">
            Các học kỳ có lượt khảo sát được phân công
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Tìm học kỳ
            </label>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tên học kỳ hoặc năm học..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa nội dung tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
              Học kỳ
            </label>
            <select
              value={selectedTerm}
              onChange={(event) => setSelectedTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Tất cả học kỳ</option>
              {terms.map((term) => (
                <option key={term.term_id} value={String(term.term_id)}>
                  {term.term_name} ({term.academic_year})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Tìm thấy{' '}
            <strong className="text-slate-800">{filteredTerms.length} học kỳ</strong>
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 self-end rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-center"
          >
            <RotateCcw size={13} className="text-slate-500" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Tổng hợp khảo sát theo học kỳ</h2>
          <p className="mt-1 text-xs text-slate-500">
            Số liệu tổng số môn được phân công, hoàn thành và còn lại ở từng học kỳ.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Đang tải thống kê khảo sát...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">Không thể tải thống kê</p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setReloadKey((key) => key + 1);
              }}
              className="mt-3 rounded-lg bg-[#08245f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0b3387]"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3.5">Học kỳ</th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-center">Tổng số môn</th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-center">Đã hoàn thành</th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-center">Chưa hoàn thành</th>
                  <th className="min-w-48 px-5 py-3.5">Tỷ lệ hoàn thành</th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-center">Chứng nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTerms.map((term) => (
                    <tr key={term.term_id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="font-bold text-slate-900">{term.term_name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Năm học {term.academic_year}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-800">
                        {term.total_assigned}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-emerald-700">
                        {term.completed}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-amber-700">
                        {term.pending}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                            role="progressbar"
                            aria-valuenow={term.completion_rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(0, term.completion_rate))}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-bold text-slate-800">
                            {term.completion_rate}%
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleExportCertificate(term)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#08245f] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#0b3387]"
                          title={`Xuất chứng nhận thống kê ${term.term_name}`}
                        >
                          <Printer size={13} />
                          Xuất chứng nhận
                        </button>
                      </td>
                    </tr>
                  ))}

                {filteredTerms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Không có dữ liệu học kỳ phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Hiển thị {filteredTerms.length} / {terms.length} học kỳ
          </div>
        )}
      </div>
    </div>
  );
}
