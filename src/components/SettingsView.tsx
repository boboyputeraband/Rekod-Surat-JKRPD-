import React, { useRef } from 'react';
import { LetterRecord, User, Language } from '../types';
import { DICT } from '../constants';
import { exportToCSV, parseCSV } from '../services/storage';
import {
  Settings,
  Download,
  Upload,
  Database,
  Trash2,
  ShieldAlert,
  Server,
  Users,
  CheckCircle,
} from 'lucide-react';

interface SettingsViewProps {
  records: LetterRecord[];
  allUsers: User[];
  lang: Language;
  onImportRecords: (newRecords: LetterRecord[]) => void;
  onLoadDemoData: () => void;
  onClearAllData: () => void;
  showToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  records,
  allUsers,
  lang,
  onImportRecords,
  onLoadDemoData,
  onClearAllData,
  showToast,
}) => {
  const t = DICT[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserName = (id?: string) => {
    if (!id) return '—';
    return allUsers.find((u) => u.id === id)?.name || id;
  };

  const handleExport = () => {
    exportToCSV(records, getUserName);
    showToast('Data berjaya dieksport ke format CSV.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCSV(text.replace(/^\ufeff/, ''));
      if (rows.length < 2) {
        showToast('Fail CSV tidak mengandungi data rekod.');
        return;
      }

      const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s_\-./]/g, '');
      const headerRow = rows[0].map(normalize);

      const getCol = (cells: string[], ...keys: string[]) => {
        const idx = headerRow.findIndex((h) => keys.map(normalize).includes(h));
        return idx < 0 ? '' : (cells[idx] || '').trim();
      };

      const importedList: LetterRecord[] = [];
      const now = new Date().toISOString();

      for (const cells of rows.slice(1)) {
        const title = getCol(cells, 'Tajuk Surat', 'Tajuk', 'Perkara', 'Subject');
        const ref = getCol(cells, 'No Rujukan Surat', 'No Rujukan', 'No. Rujukan', 'Reference');
        if (!title || !ref) continue;

        const fileNo = getCol(cells, 'No Rujukan Fail', 'No Fail', 'Nombor Fail', 'File');
        const sender = getCol(cells, 'Pengirim', 'Daripada', 'Sender') || 'Tidak Dinyatakan';
        const letterDate = getCol(cells, 'Tarikh Surat', 'Date') || now.slice(0, 10);
        const receivedDate = getCol(cells, 'Tarikh Terima', 'Received') || now.slice(0, 10);
        const unit = getCol(cells, 'Unit') || undefined;

        importedList.push({
          id: `S-IMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
          title,
          ref,
          fileNo,
          sender,
          letterDate,
          receivedDate,
          unit,
          createdAt: now,
          lastProgressAt: now,
          createdBy: 'pka',
          status: 'Baru',
          assigneeId: '',
          instructions: '',
          notes: '',
          fileLocation: '',
          attachmentName: '',
          history: [
            {
              when: now,
              by: 'pka',
              action: 'Diimport daripada fail CSV',
            },
          ],
        });
      }

      if (importedList.length === 0) {
        showToast('Tiada rekod sah ditemui dalam CSV.');
      } else {
        onImportRecords(importedList);
        showToast(`${importedList.length} rekod berjaya diimport daripada CSV.`);
      }
    } catch (err: any) {
      showToast('Ralat memproses fail CSV: ' + err.message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title Bar */}
      <div>
        <h1 className="text-2xl font-black text-[#102942] tracking-tight">
          {t.settings}
        </h1>
        <p className="text-xs text-[#61758b] mt-0.5">
          {lang === 'ms'
            ? 'Panduan operasi, simulasi peranan dan pengurusan sandaran data sistem.'
            : 'Operational guide, role simulation and system data management.'}
        </p>
      </div>

      {/* Warning Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-1">Peringatan Keselamatan:</strong>
          <span>
            {t.available} {lang === 'ms' ? 'Jangan masukkan surat berstatus Rahsia Rasmi atau maklumat sulit kerajaan ke dalam peranti ujian prototaip.' : 'Do not input classified or confidential government letters into this prototype.'}
          </span>
        </div>
      </div>

      {/* Columns: Role Simulation & Data Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Explanation Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-[#102942]">{t.role}</h2>
          </div>
          <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
            Dalam prototaip ini, anda boleh menukar simulasi peranan pengguna melalui menu pilihan di penjuru kanan atas bar navigasi.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
              <div>
                <strong className="block text-slate-800">PKA Pendaftaran</strong>
                <span className="text-[11px] text-slate-500">Mendaftar surat masuk & merekod pemfailan fizikal</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px]">Pendaftar</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
              <div>
                <strong className="block text-slate-800">Jurutera Jalan</strong>
                <span className="text-[11px] text-slate-500">Minit arahan siasatan & agihan kepada pegawai</span>
              </div>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-md text-[10px]">Ketua Bahagian</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
              <div>
                <strong className="block text-slate-800">Pegawai Pelaksana</strong>
                <span className="text-[11px] text-slate-500">Kemas kini status tindakan tapak & maklum balas</span>
              </div>
              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded-md text-[10px]">Pelaksana</span>
            </div>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-[#102942]">Pengurusan Rekod Data</h2>
            </div>
            <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
              {t.importhelp} Data teks disimpan secara kekal dalam storan tempatan pelayar; lampiran fail disimpan dalam IndexedDB.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t.export}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs transition"
              >
                <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.import}</span>
              </button>

              <button
                type="button"
                onClick={onLoadDemoData}
                className="p-3 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-xl text-left text-xs font-bold text-blue-900 flex items-center gap-2 transition"
              >
                <span className="text-blue-600 font-bold">◈</span>
                <span>{t.demo}</span>
              </button>

              <button
                type="button"
                onClick={onClearAllData}
                className="p-3 bg-red-50/70 hover:bg-red-100 border border-red-200 rounded-xl text-left text-xs font-bold text-red-700 flex items-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>{t.clear}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Jumlah rekod semasa: <b>{records.length}</b> surat.
          </div>
        </div>
      </div>

      {/* Workflow Stepper Guide */}
      <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
        <h2 className="text-base font-bold text-[#102942] mb-4">{t.help}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              1
            </div>
            <strong className="block text-xs font-bold text-slate-800 mb-1">Daftar Surat</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pilih peranan PKA Pendaftaran, kemudian lengkapkan borang Daftar Surat bersama imbasan dokumen.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              2
            </div>
            <strong className="block text-xs font-bold text-slate-800 mb-1">Minit Arahan</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pilih Jurutera Jalan, buka surat, buka tab Tindakan dan tentukan pegawai pelaksana serta unit.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              3
            </div>
            <strong className="block text-xs font-bold text-slate-800 mb-1">Tindakan Pegawai</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pilih nama pegawai yang ditugaskan untuk mengemas kini maklum balas tapak dan status kepada Selesai.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
              4
            </div>
            <strong className="block text-xs font-bold text-slate-800 mb-1">Rekod Pemfailan</strong>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Selepas tindakan selesai, PKA memasukkan lokasi simpanan fizikal fail dan menandakan status Difailkan.
            </p>
          </div>
        </div>
      </div>

      {/* Enterprise ICT Specifications */}
      <div className="bg-white rounded-2xl p-6 border border-[#e1e8f0] shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-[#102942]">Keperluan Pelaksanaan Rasmi oleh Bahagian ICT</h2>
        </div>
        <p className="text-xs text-[#64748b] leading-relaxed mb-4">
          Spesifikasi sistem penuh bagi fasa pengeluaran (production rollout) seperti dalam perancangan BRS JKR:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Pangkalan data berpusat dengan sandaran harian (PostgreSQL / Cloud Database).</span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Integrasi Single Sign-On (SSO) MyIdentity / Portal JKR Bersepadu.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Storan fail selamat dengan enkripsi dokumen rasmi (AES-256).</span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Notifikasi automatik menerusi e-mel rasmi dan webhook WhatsApp Gateway.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
