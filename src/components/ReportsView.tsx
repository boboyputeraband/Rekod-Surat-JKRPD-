import React, { useState } from 'react';
import { LetterRecord, User, Language, ReportPeriod } from '../types';
import { DICT, UNITS, STATUSES } from '../constants';
import { isOverdue, isNearDue, exportToCSV } from '../services/storage';
import { BarChart3, Download, Calendar, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface ReportsViewProps {
  records: LetterRecord[];
  allUsers: User[];
  lang: Language;
  onOpenRecord: (id: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  allUsers,
  lang,
  onOpenRecord,
}) => {
  const t = DICT[lang];
  const [period, setPeriod] = useState<ReportPeriod>('monthly');

  const getUserName = (id?: string) => {
    if (!id) return '—';
    return allUsers.find((u) => u.id === id)?.name || id;
  };

  const getPeriodStart = (p: ReportPeriod): Date => {
    const now = new Date();
    const start = new Date(now);
    if (p === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (p === 'weekly') {
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
    } else if (p === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === 'yearly') {
      return new Date(now.getFullYear(), 0, 1);
    } else {
      return new Date(0);
    }
    return start;
  };

  const periodStart = getPeriodStart(period);
  const filtered = records
    .filter((r) => new Date(r.createdAt) >= periodStart)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const pending = filtered.filter((r) => r.status === 'Baru').length;
  const active = filtered.filter((r) => ['Diminitkan', 'Dalam Tindakan'].includes(r.status)).length;
  const overdueCount = filtered.filter(isOverdue).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (r: LetterRecord) => {
    let colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
    if (r.status === 'Diminitkan') colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
    if (r.status === 'Dalam Tindakan') colorClass = 'bg-teal-100 text-teal-800 border-teal-200';
    if (r.status === 'Selesai') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (r.status === 'Difailkan') colorClass = 'bg-slate-100 text-slate-700 border-slate-300';

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorClass} whitespace-nowrap`}
        >
          {r.status}
        </span>
        {isOverdue(r) && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse whitespace-nowrap">
            48j+
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#102942] tracking-tight">
            {t.reports}
          </h1>
          <p className="text-xs text-[#61758b] mt-0.5">{t.welcome}</p>
        </div>
        <button
          type="button"
          onClick={() => exportToCSV(filtered, getUserName)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>{t.export} ({filtered.length})</span>
        </button>
      </div>

      {/* Period Selector Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">{t.period}:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold flex-wrap">
            {(['daily', 'weekly', 'monthly', 'yearly', 'all'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === p
                    ? 'bg-[#102942] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {t[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics in chosen period */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1 font-medium">{t.total}</span>
            <span className="text-2xl font-black text-slate-900">{total}</span>
          </div>
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1 font-medium">{t.pending}</span>
            <span className="text-2xl font-black text-amber-600">{pending}</span>
          </div>
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1 font-medium">{t.active}</span>
            <span className="text-2xl font-black text-teal-600">{active}</span>
          </div>
          <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block mb-1 font-medium">{t.overdue}</span>
            <span className="text-2xl font-black text-red-600">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
          <h2 className="text-base font-bold text-[#102942] mb-4">{t.statistics}</h2>
          <div className="space-y-4">
            {STATUSES.map((status) => {
              const count = filtered.filter((r) => r.status === status).length;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{status}</span>
                    <span className="font-bold text-slate-900">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'Baru'
                          ? 'bg-blue-500'
                          : status === 'Diminitkan'
                          ? 'bg-purple-500'
                          : status === 'Dalam Tindakan'
                          ? 'bg-teal-500'
                          : status === 'Selesai'
                          ? 'bg-emerald-500'
                          : 'bg-slate-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unit Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#102942] mb-4">{t.byunit}</h2>
            <div className="divide-y divide-slate-100">
              {UNITS.map((u) => {
                const count = filtered.filter((r) => r.unit === u).length;
                return (
                  <div key={u} className="py-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{u}</span>
                    <span className="font-extrabold text-[#102942] bg-slate-100 px-3 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            * Data dikira berdasarkan tarikh terima dan pendaftaran surat dalam tempoh {t[period].toLowerCase()}.
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
        <h2 className="text-base font-bold text-[#102942] mb-4">
          {t.records} ({filtered.length})
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#61758b]">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">{t.noresults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 text-[#71859b] font-bold uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="py-2.5 px-3 rounded-l-lg">{t.ref}</th>
                  <th className="py-2.5 px-3">{t.title}</th>
                  <th className="py-2.5 px-3">{t.dateletter}</th>
                  <th className="py-2.5 px-3">{t.unit}</th>
                  <th className="py-2.5 px-3">{t.assignee}</th>
                  <th className="py-2.5 px-3">{t.status}</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{r.ref}</span>
                      <span className="text-[11px] text-slate-400">{r.fileNo}</span>
                    </td>
                    <td className="py-3 px-3 max-w-[260px]">
                      <span className="font-semibold text-slate-800 block line-clamp-1">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {r.sender}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(r.letterDate)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {r.unit || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {getUserName(r.assigneeId)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">{getStatusBadge(r)}</td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenRecord(r.id)}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition"
                      >
                        {t.details} →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
