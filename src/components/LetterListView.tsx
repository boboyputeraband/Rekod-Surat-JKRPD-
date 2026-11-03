import React, { useState } from 'react';
import { LetterRecord, User, Language, RoadUnit, LetterStatus } from '../types';
import { DICT, UNITS, STATUSES } from '../constants';
import { isOverdue, isNearDue, exportToCSV } from '../services/storage';
import { Search, Download, Plus, Filter, FileText, ArrowUpDown } from 'lucide-react';

interface LetterListViewProps {
  records: LetterRecord[];
  allUsers: User[];
  lang: Language;
  onOpenRecord: (id: string) => void;
  onNavigateToRegister: () => void;
}

export const LetterListView: React.FC<LetterListViewProps> = ({
  records,
  allUsers,
  lang,
  onOpenRecord,
  onNavigateToRegister,
}) => {
  const t = DICT[lang];

  const [filterText, setFilterText] = useState('');
  const [filterUnit, setFilterUnit] = useState<RoadUnit | ''>('');
  const [filterStatus, setFilterStatus] = useState<LetterStatus | ''>('');

  const getUserName = (id?: string) => {
    if (!id) return '—';
    return allUsers.find((u) => u.id === id)?.name || id;
  };

  const filtered = records
    .filter((r) => {
      const q = filterText.toLowerCase();
      const assigneeName = getUserName(r.assigneeId).toLowerCase();
      const matchText = [
        r.title,
        r.ref,
        r.fileNo,
        r.sender,
        r.unit || '',
        assigneeName,
        r.instructions || '',
        r.notes || '',
      ]
        .join(' ')
        .toLowerCase();

      const textMatches = !filterText || matchText.includes(q);
      const unitMatches = !filterUnit || r.unit === filterUnit;
      const statusMatches = !filterStatus || r.status === filterStatus;

      return textMatches && unitMatches && statusMatches;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

  const handleExport = () => {
    exportToCSV(filtered, getUserName);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#102942] tracking-tight">
            {t.letters}
          </h1>
          <p className="text-xs text-[#61758b] mt-0.5">
            {filtered.length} {t.records}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-[#cbd5e1] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t.export}</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#205ebc] hover:bg-[#184b96] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newletter}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#e1e8f0] shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#d9e2eb] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value as RoadUnit | '')}
              className="w-full px-3 py-2.5 bg-white border border-[#d9e2eb] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">{t.all} {t.unit}</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LetterStatus | '')}
              className="w-full px-3 py-2.5 bg-white border border-[#d9e2eb] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">{t.all} {t.status}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#61758b]">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">{t.noresults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 text-[#71859b] font-bold uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="py-3 px-3 rounded-l-lg">{t.ref}</th>
                  <th className="py-3 px-3">{t.title}</th>
                  <th className="py-3 px-3">{t.dateletter}</th>
                  <th className="py-3 px-3">{t.unit}</th>
                  <th className="py-3 px-3">{t.assignee}</th>
                  <th className="py-3 px-3">{t.status}</th>
                  <th className="py-3 px-3 text-right rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block">{r.ref}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {r.fileNo || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 max-w-[280px]">
                      <span className="font-semibold text-slate-800 block line-clamp-1" title={r.title}>
                        {r.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {r.sender}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(r.letterDate)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                      {r.unit || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap font-medium">
                      {getUserName(r.assigneeId)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(r)}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenRecord(r.id)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition"
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
