import React from 'react';
import { LetterRecord, User, Language, ActivePage } from '../types';
import { DICT, UNITS } from '../constants';
import { isOverdue, isNearDue } from '../services/storage';
import {
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Search,
  BarChart2,
  Calendar,
  Layers,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

interface DashboardViewProps {
  records: LetterRecord[];
  allUsers: User[];
  lang: Language;
  onNavigate: (page: ActivePage) => void;
  onOpenRecord: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  allUsers,
  lang,
  onNavigate,
  onOpenRecord,
}) => {
  const t = DICT[lang];

  const total = records.length;
  const pending = records.filter((r) => r.status === 'Baru').length;
  const active = records.filter((r) => ['Diminitkan', 'Dalam Tindakan'].includes(r.status)).length;
  const overdueCount = records.filter(isOverdue).length;

  const latestRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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
        {isNearDue(r) && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
            36j+
          </span>
        )}
      </div>
    );
  };

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

  return (
    <div className="space-y-6">
      {/* Heading Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#102942] tracking-tight">
            {t.dashboard}
          </h1>
          <p className="text-xs text-[#61758b] mt-0.5">{t.welcome}</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('daftar')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#205ebc] hover:bg-[#184b96] text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newletter}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Letters */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#61758b]">
            <span className="font-semibold">{t.total}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172b42] my-2 tracking-tight">
            {total}
          </div>
          <div className="text-[11px] text-[#8ca0b3] font-medium">{t.alltime}</div>
        </div>

        {/* Awaiting Assignment (Baru) */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#61758b]">
            <span className="font-semibold">{t.pending}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172b42] my-2 tracking-tight">
            {pending}
          </div>
          <div className="text-[11px] text-[#8ca0b3] font-medium">{t.waiting}</div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#61758b]">
            <span className="font-semibold">{t.active}</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#172b42] my-2 tracking-tight">
            {active}
          </div>
          <div className="text-[11px] text-[#8ca0b3] font-medium">{t.progress}</div>
        </div>

        {/* Overdue (> 48h) */}
        <div className="bg-white p-5 rounded-2xl border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#61758b]">
            <span className="font-semibold">{t.overdue}</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-600 my-2 tracking-tight">
            {overdueCount}
          </div>
          <div className="text-[11px] text-red-500 font-medium">{t.need}</div>
        </div>
      </div>

      {/* Columns: Left (Tables & Charts) / Right (Workflow & Tools) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Latest Letters */}
          <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#102942]">{t.latest}</h2>
              <button
                type="button"
                onClick={() => onNavigate('surat')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>{t.seeall}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestRecords.length === 0 ? (
              <div className="text-center py-12 text-[#61758b]">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t.empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#71859b] font-bold uppercase tracking-wider text-[10px] bg-slate-50/60">
                      <th className="py-2.5 px-3 rounded-l-lg">{t.ref}</th>
                      <th className="py-2.5 px-3">{t.title}</th>
                      <th className="py-2.5 px-3">{t.dateletter}</th>
                      <th className="py-2.5 px-3">{t.unit}</th>
                      <th className="py-2.5 px-3">{t.status}</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {latestRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block">{r.ref}</span>
                          <span className="text-[11px] text-slate-400">{r.fileNo || '—'}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[240px]">
                          <span className="font-semibold text-slate-800 block line-clamp-1" title={r.title}>
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

          {/* Unit Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
            <h2 className="text-base font-bold text-[#102942] mb-4">{t.byunit}</h2>
            <div className="space-y-3.5">
              {UNITS.map((u) => {
                const count = records.filter((r) => r.unit === u).length;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={u}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{u}</span>
                      <span className="font-bold text-slate-900">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workflow Guide */}
          <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
            <h2 className="text-base font-bold text-[#102942] mb-4">{t.workflow}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  01
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-800">PKA Pendaftaran</strong>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'ms' ? 'Imbas & daftar surat masuk' : 'Scan & register incoming letter'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  02
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Jurutera Jalan</strong>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'ms' ? 'Minitkan & agih arahan tugas' : 'Assign officer & instructions'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  03
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-800">Pegawai Pelaksana</strong>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'ms' ? 'Ambil tindakan & kemas kini maklum balas' : 'Take action & add feedback'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  04
                </div>
                <div>
                  <strong className="block text-xs font-bold text-slate-800">PKA Pendaftaran</strong>
                  <span className="text-[11px] text-slate-500">
                    {lang === 'ms' ? 'Tandakan selesai & rekod fail fizikal' : 'Close and record physical file'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
            <h2 className="text-base font-bold text-[#102942] mb-3">{t.quick}</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('surat')}
                className="p-3 bg-blue-50/70 hover:bg-blue-100 border border-blue-100 rounded-xl text-left text-xs font-bold text-blue-800 flex flex-col gap-1 transition"
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>{t.letters}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('laporan')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 flex flex-col gap-1 transition"
              >
                <BarChart2 className="w-4 h-4 text-slate-600" />
                <span>{t.reports}</span>
              </button>
            </div>
          </div>

          {/* Prototype disclaimer callout */}
          <div className="bg-[#edf6ff] border border-[#d3e8fc] rounded-2xl p-4 text-xs text-[#285274] leading-relaxed flex items-start gap-2.5">
            <span className="text-base font-bold shrink-0">ⓘ</span>
            <span>{t.available}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
