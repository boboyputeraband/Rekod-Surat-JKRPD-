import React, { useState, useEffect } from 'react';
import { LetterRecord, User, Language, RoadUnit, LetterStatus } from '../types';
import { DICT, UNITS } from '../constants';
import { isOverdue, isNearDue, getAttachmentBlob } from '../services/storage';
import {
  X,
  FileText,
  Clock,
  Download,
  CheckCircle2,
  AlertCircle,
  History,
  Send,
  FolderCheck,
  UserCheck,
} from 'lucide-react';

interface LetterDetailModalProps {
  record: LetterRecord;
  currentUser: User;
  allUsers: User[];
  lang: Language;
  onClose: () => void;
  onUpdateRecord: (updated: LetterRecord) => void;
  onSwitchUser: (userId: string) => void;
  showToast: (msg: string) => void;
}

export const LetterDetailModal: React.FC<LetterDetailModalProps> = ({
  record,
  currentUser,
  allUsers,
  lang,
  onClose,
  onUpdateRecord,
  onSwitchUser,
  showToast,
}) => {
  const t = DICT[lang];
  const [activeTab, setActiveTab] = useState<'info' | 'work' | 'history'>('info');

  // Minit form state (Jurutera Jalan)
  const [assigneeId, setAssigneeId] = useState(record.assigneeId || '');
  const [unit, setUnit] = useState<RoadUnit>(
    (record.unit as RoadUnit) || 'Jalan Persekutuan'
  );
  const [instructions, setInstructions] = useState(record.instructions || '');

  // Progress form state (Pegawai Pelaksana)
  const [actionStatus, setActionStatus] = useState<LetterStatus>(
    record.status === 'Baru' ? 'Dalam Tindakan' : (record.status as LetterStatus)
  );
  const [actionNotes, setActionNotes] = useState(record.notes || '');

  // Filing form state (PKA)
  const [fileLocation, setFileLocation] = useState(
    record.fileLocation || record.fileNo || 'Bilik Fail Aras 1 / Rak A'
  );

  const [hasAttachment, setHasAttachment] = useState(!!record.attachmentName);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const getUserName = (id?: string) => {
    if (!id) return '—';
    return allUsers.find((u) => u.id === id)?.name || id;
  };

  const formatDate = (dateStr?: string) => {
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const canMinute = currentUser.role === 'jurutera';
  const isAssignedOfficer =
    currentUser.role === 'pelaksana' &&
    (record.assigneeId === currentUser.id || !record.assigneeId);
  const canFile = currentUser.role === 'pendaftar' && record.status === 'Selesai';

  const handleDownloadAttachment = async () => {
    setIsLoadingFile(true);
    try {
      const blob = await getAttachmentBlob(record.id);
      if (!blob) {
        showToast('Fail lampiran tidak ditemui dalam storan peranti ini.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.attachmentName || 'lampiran_surat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast('Lampiran sedang dimuat turun.');
    } catch (err: any) {
      showToast('Gagal membuka lampiran: ' + err.message);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleMinuteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMinute) return;

    const now = new Date().toISOString();
    const assignedName = getUserName(assigneeId);

    const updated: LetterRecord = {
      ...record,
      assigneeId,
      unit,
      instructions: instructions.trim(),
      status: 'Diminitkan',
      lastProgressAt: now,
      history: [
        ...(record.history || []),
        {
          when: now,
          by: currentUser.id,
          action: `Arahan diminitkan kepada ${assignedName} (${unit})`,
        },
      ],
    };

    onUpdateRecord(updated);
    showToast('Minit arahan berjaya disimpan.');
    setActiveTab('info');
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    const updated: LetterRecord = {
      ...record,
      status: actionStatus,
      notes: actionNotes.trim(),
      lastProgressAt: now,
      history: [
        ...(record.history || []),
        {
          when: now,
          by: currentUser.id,
          action: `Status dikemas kini kepada ${actionStatus}. Maklum balas: ${actionNotes.slice(0, 40)}...`,
        },
      ],
    };

    onUpdateRecord(updated);
    showToast('Maklum balas tindakan berjaya disimpan.');
    setActiveTab('info');
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canFile) return;

    const now = new Date().toISOString();
    const updated: LetterRecord = {
      ...record,
      status: 'Difailkan',
      fileLocation: fileLocation.trim(),
      lastProgressAt: now,
      history: [
        ...(record.history || []),
        {
          when: now,
          by: currentUser.id,
          action: `Surat direkodkan sebagai difailkan di ${fileLocation}`,
        },
      ],
    };

    onUpdateRecord(updated);
    showToast('Surat berjaya ditandakan sebagai difailkan.');
    setActiveTab('info');
  };

  const getStatusBadge = () => {
    let colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
    if (record.status === 'Diminitkan') colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
    if (record.status === 'Dalam Tindakan') colorClass = 'bg-teal-100 text-teal-800 border-teal-200';
    if (record.status === 'Selesai') colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (record.status === 'Difailkan') colorClass = 'bg-slate-100 text-slate-700 border-slate-300';

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
          {record.status}
        </span>
        {isOverdue(record) && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            Melebihi 48 Jam
          </span>
        )}
        {isNearDue(record) && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            Melebihi 36 Jam
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-[#0b1e31]/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 p-6 md:p-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {record.ref} • {formatDate(record.receivedDate)}
            </div>
            <h2 className="text-xl font-extrabold text-[#102942] leading-tight mb-2">
              {record.title}
            </h2>
            <div>{getStatusBadge()}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-4 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.details}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('work')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'work'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.actions}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.audit} ({(record.history || []).length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto pr-1 flex-1">
          {/* TAB 1: INFO / DETAILS */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.ref}
                  </span>
                  <strong className="text-xs text-slate-800 break-words">{record.ref}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.fileno}
                  </span>
                  <strong className="text-xs text-slate-800 break-words">{record.fileNo || '—'}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.sender}
                  </span>
                  <strong className="text-xs text-slate-800 break-words">{record.sender}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.dateletter}
                  </span>
                  <strong className="text-xs text-slate-800">{formatDate(record.letterDate)}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.datereceived}
                  </span>
                  <strong className="text-xs text-slate-800">{formatDate(record.receivedDate)}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.unit}
                  </span>
                  <strong className="text-xs text-slate-800">{record.unit || '—'}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.assignee}
                  </span>
                  <strong className="text-xs text-slate-800 font-bold text-blue-700">
                    {getUserName(record.assigneeId)}
                  </strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.regby}
                  </span>
                  <strong className="text-xs text-slate-800">{getUserName(record.createdBy)}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.issued}
                  </span>
                  <strong className="text-xs text-slate-800">{formatDateTime(record.createdAt)}</strong>
                </div>

                <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    {t.filelabel}
                  </span>
                  <strong className="text-xs text-slate-800">{record.fileLocation || '—'}</strong>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                  {t.instruction} (Jurutera Jalan)
                </span>
                <p className="text-xs text-purple-950 leading-relaxed whitespace-pre-wrap">
                  {record.instructions || 'Belum diminitkan arahan khusus.'}
                </p>
              </div>

              {/* Notes Box */}
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block mb-1">
                  {t.progressnote} (Pegawai Bertanggungjawab)
                </span>
                <p className="text-xs text-teal-950 leading-relaxed whitespace-pre-wrap">
                  {record.notes || 'Belum ada maklum balas tindakan dilaporkan.'}
                </p>
              </div>

              {/* Attachment Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-bold uppercase">
                      {t.attachment}
                    </span>
                    <strong className="text-xs text-slate-800">
                      {record.attachmentName || t.noattachment}
                    </strong>
                  </div>
                </div>

                {record.attachmentName && (
                  <button
                    type="button"
                    onClick={handleDownloadAttachment}
                    disabled={isLoadingFile}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isLoadingFile ? 'Membuka...' : t.download}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIONS / WORKFLOW */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              {/* Option A: Jurutera Jalan - Minit Arahan */}
              {canMinute ? (
                <form onSubmit={handleMinuteSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-800">{t.minutes}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.assignee} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-purple-500 outline-none"
                      >
                        <option value="">— {t.sel} —</option>
                        {allUsers
                          .filter((u) => u.role === 'pelaksana')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} [{u.unit || 'Jalan'}]
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.unit} <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as RoadUnit)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-purple-500 outline-none"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.instruction} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Contoh: Sila buat lawatan tapak bersama juruteknik, sediakan laporan siasatan dan anggaran kos pembaikan."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-purple-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      {t.assign}
                    </button>
                  </div>
                </form>
              ) : isAssignedOfficer ? (
                /* Option B: Pegawai Pelaksana - Kemas kini tindakan */
                <form onSubmit={handleProgressSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-800">{t.progressnote}</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.status}
                    </label>
                    <select
                      value={actionStatus}
                      onChange={(e) => setActionStatus(e.target.value as LetterStatus)}
                      className="w-full sm:w-1/2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-500 outline-none"
                    >
                      <option value="Dalam Tindakan">Dalam Tindakan</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.progressnote} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Contoh: Lawatan tapak telah dijalankan pada 02/11. Kontraktor telah ditugaskan dan kerja pembaikan disiapkan sepenuhnya."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      {t.update}
                    </button>
                  </div>
                </form>
              ) : canFile ? (
                /* Option C: PKA Pendaftaran - Rekod Pemfailan */
                <form onSubmit={handleFileSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">Rekod Pemfailan Fizikal</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.filelabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fileLocation}
                      onChange={(e) => setFileLocation(e.target.value)}
                      placeholder="Contoh: Bilik Fail Aras 1 / Rak B / Fail 2026-08"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      ✓ Tandakan Difailkan
                    </button>
                  </div>
                </form>
              ) : (
                /* Option D: Role Helper Switcher */
                <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      <strong className="block font-bold mb-1">
                        Tindakan Terhad Mengikut Peranan Semasa:
                      </strong>
                      <span>
                        Pengguna semasa ialah <b>{currentUser.name}</b> (
                        {currentUser.role === 'jurutera'
                          ? 'Jurutera Jalan'
                          : currentUser.role === 'pendaftar'
                          ? 'PKA Pendaftaran'
                          : 'Pegawai Pelaksana'}
                        ).
                      </span>
                    </div>
                  </div>

                  {/* Contextual quick buttons to switch role and test immediately */}
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-2">
                      Tukar peranan untuk terus menguji:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onSwitchUser('jj')}
                        className="px-3 py-1.5 bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Tukar ke Jurutera Jalan (Minit)</span>
                      </button>

                      {record.assigneeId && (
                        <button
                          type="button"
                          onClick={() => onSwitchUser(record.assigneeId!)}
                          className="px-3 py-1.5 bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Tukar ke {getUserName(record.assigneeId)} (Tindakan)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSwitchUser('pka')}
                        className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Tukar ke PKA Pendaftaran</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-blue-200 space-y-6 my-2">
                {[...(record.history || [])].reverse().map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <strong className="block text-xs font-bold text-slate-800">
                      {h.action}
                    </strong>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(h.when)}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {getUserName(h.by)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
