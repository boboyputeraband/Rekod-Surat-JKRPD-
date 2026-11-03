import React, { useState } from 'react';
import { LetterRecord, User, Language, RoadUnit } from '../types';
import { DICT, UNITS } from '../constants';
import { saveAttachmentBlob } from '../services/storage';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface LetterFormViewProps {
  currentUser: User;
  lang: Language;
  onSaveRecord: (newRecord: LetterRecord) => void;
  onCancel: () => void;
  onSwitchToPka: () => void;
  showToast: (msg: string) => void;
}

export const LetterFormView: React.FC<LetterFormViewProps> = ({
  currentUser,
  lang,
  onSaveRecord,
  onCancel,
  onSwitchToPka,
  showToast,
}) => {
  const t = DICT[lang];

  const todayStr = new Date().toLocaleDateString('en-CA');

  const [title, setTitle] = useState('');
  const [ref, setRef] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [sender, setSender] = useState('');
  const [letterDate, setLetterDate] = useState(todayStr);
  const [receivedDate, setReceivedDate] = useState(todayStr);
  const [unit, setUnit] = useState<RoadUnit | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPka = currentUser.role === 'pendaftar';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setFilePreview(null);
      return;
    }

    if (selected.size > 8 * 1024 * 1024) {
      showToast('Saiz fail melebihi had 8 MB.');
      e.target.value = '';
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      showToast('Format fail tidak disokong. Sila pilih fail JPG, PNG, WEBP atau PDF.');
      e.target.value = '';
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPka) {
      showToast('Hanya peranan PKA Pendaftaran dibenarkan mendaftar surat.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const newId = `S-JKRPD-${Date.now().toString(36).toUpperCase()}`;

    try {
      if (file) {
        await saveAttachmentBlob(newId, file);
      }

      const newRecord: LetterRecord = {
        id: newId,
        title: title.trim(),
        ref: ref.trim(),
        fileNo: fileNo.trim(),
        sender: sender.trim(),
        letterDate,
        receivedDate,
        unit: unit || undefined,
        createdAt: now,
        lastProgressAt: now,
        createdBy: currentUser.id,
        status: 'Baru',
        assigneeId: '',
        instructions: '',
        notes: '',
        fileLocation: '',
        attachmentName: file ? file.name : '',
        history: [
          {
            when: now,
            by: currentUser.id,
            action: `Surat didaftarkan oleh ${currentUser.name} (${currentUser.title || 'PKA'})`,
          },
        ],
      };

      onSaveRecord(newRecord);
      showToast('Surat berjaya didaftarkan.');
    } catch (err: any) {
      console.error(err);
      showToast('Ralat semasa menyimpan rekod: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#102942] tracking-tight">
            {t.newform}
          </h1>
          <p className="text-xs text-[#61758b] mt-0.5">{t.note}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Role permission alert */}
      {!isPka && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between flex-wrap gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold">Peranan Semasa: {currentUser.name}</strong>
              <span>
                Pendaftaran surat masuk dikhususkan kepada peranan <b>PKA Pendaftaran</b>.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToPka}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition"
          >
            Tukar Peranan ke PKA Pendaftaran
          </button>
        </div>
      )}

      {/* Form panel */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 border border-[#e1e8f0] shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102942] border-b border-slate-100 pb-3">
          Maklumat Surat & Fail
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#435a72] mb-1.5">
              {t.title} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={250}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Aduan kerosakan jalan berlubang di FT005 Pasir Panjang"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.ref} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Contoh: JKR.PD/FT005/01/2026(04)"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.fileno} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={fileNo}
                onChange={(e) => setFileNo(e.target.value)}
                placeholder="Contoh: JKR.PD/FAIL/JLN-FT005-01"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.sender} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Contoh: Majlis Perbandaran Port Dickson (MPPD)"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.unit}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as RoadUnit | '')}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              >
                <option value="">— {t.sel} —</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.dateletter} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#435a72] mb-1.5">
                {t.datereceived} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Attachment upload */}
          <div>
            <label className="block text-xs font-bold text-[#435a72] mb-1.5">
              {t.upload}
            </label>
            <div className="p-4 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition shrink-0">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Pilih Fail Dokumen</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <div className="text-xs text-slate-500">
                  {file ? (
                    <div className="flex items-center gap-2 font-medium text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <span>Format JPG, PNG atau PDF. Maksimum 8 MB. Disimpan terus dalam pelayar peranti.</span>
                  )}
                </div>
              </div>

              {filePreview && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-3">
                  <img
                    src={filePreview}
                    alt="Pratonton Lampiran"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="text-xs text-slate-600">
                    <strong className="block">Pratonton Imbasan Surat</strong>
                    <span>Dokumen sedia untuk disimpan bersama rekod ini.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white border border-[#d9e2eb] hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={!isPka || isSubmitting}
            className="px-5 py-2.5 bg-[#205ebc] hover:bg-[#184b96] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : t.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
