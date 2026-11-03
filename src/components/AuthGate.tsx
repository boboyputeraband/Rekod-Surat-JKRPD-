import React, { useState, useEffect } from 'react';
import { User, RoleType, RoadUnit } from '../types';
import {
  getStoredAccounts,
  saveStoredAccount,
  hashPassword,
  generateSalt,
  getRememberedId,
  setRememberedId,
  setStoredSession,
  setStoredActor,
} from '../services/storage';
import { DEFAULT_USERS } from '../constants';
import { ShieldCheck, Eye, EyeOff, FileText, CheckCircle2, Clock, ArrowRight, UserCheck } from 'lucide-react';

interface AuthGateProps {
  onLoginSuccess: (userId: string) => void;
  lang: 'ms' | 'en';
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginSuccess, lang }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regStaffId, setRegStaffId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<string>('');
  const [regUnit, setRegUnit] = useState<RoadUnit | ''>('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    const remembered = getRememberedId();
    if (remembered) {
      setLoginId(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleQuickDemoLogin = (userId: string) => {
    setStoredSession(userId);
    setStoredActor(userId);
    onLoginSuccess(userId);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const trimmedId = loginId.trim().toLowerCase();

    // Check if it's one of the default built-in roles
    if (trimmedId === 'pka' || trimmedId === 'jkrpd001') {
      setRememberedId(trimmedId, rememberMe);
      setStoredSession('pka');
      setStoredActor('pka');
      onLoginSuccess('pka');
      return;
    }
    if (trimmedId === 'jj' || trimmedId === 'jkrpd002') {
      setRememberedId(trimmedId, rememberMe);
      setStoredSession('jj');
      setStoredActor('jj');
      onLoginSuccess('jj');
      return;
    }
    if (trimmedId === 'azmir' || trimmedId === 'u0') {
      setRememberedId(trimmedId, rememberMe);
      setStoredSession('u0');
      setStoredActor('u0');
      onLoginSuccess('u0');
      return;
    }

    const accounts = getStoredAccounts();
    const found = accounts.find((a) => a.loginId?.toLowerCase() === trimmedId);

    if (!found) {
      setMessage({
        text: 'ID pengguna tidak ditemui. Anda boleh menggunakan Butang Demo Pantas di bawah atau mendaftar akaun baharu.',
        isError: true,
      });
      return;
    }

    const calculatedHash = await hashPassword(loginPassword, found.salt);
    if (calculatedHash !== found.hash) {
      setMessage({
        text: 'Kata laluan tidak sah. Sila cuba lagi atau gunakan butang demo.',
        isError: true,
      });
      return;
    }

    setRememberedId(trimmedId, rememberMe);
    setStoredSession(found.id);
    setStoredActor(found.id);
    onLoginSuccess(found.id);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (regPassword !== regConfirmPassword) {
      setMessage({ text: 'Pengesahan kata laluan tidak sepadan.', isError: true });
      return;
    }

    if (regPassword.length < 8) {
      setMessage({ text: 'Kata laluan mesti sekurang-kurangnya 8 aksara.', isError: true });
      return;
    }

    const trimmedLoginId = regStaffId.trim().toLowerCase();
    const existing = getStoredAccounts();
    if (existing.some((a) => a.loginId?.toLowerCase() === trimmedLoginId)) {
      setMessage({ text: 'ID pengguna ini telah didaftarkan pada peranti ini.', isError: true });
      return;
    }

    let mappedRole: RoleType = 'pelaksana';
    if (regRole === 'PKA') mappedRole = 'pendaftar';
    else if (regRole === 'Jurutera Jalan') mappedRole = 'jurutera';

    const salt = generateSalt();
    const hash = await hashPassword(regPassword, salt);

    const newAccount = {
      id: `demo_${trimmedLoginId}`,
      loginId: trimmedLoginId,
      name: regFullName.trim(),
      email: regEmail.trim(),
      role: mappedRole,
      title: regRole,
      unit: regUnit || 'PTJ Jalan',
      salt,
      hash,
    };

    saveStoredAccount(newAccount);
    setMessage({
      text: 'Pendaftaran ID demonstrasi berjaya! Sila log masuk dengan ID dan kata laluan anda.',
      isError: false,
    });
    setLoginId(trimmedLoginId);
    setLoginPassword('');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#152b42] flex flex-col font-sans">
      {/* Header bar */}
      <header className="h-[72px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/aistudio/image_523558bb.png"
            alt="Logo JKR Port Dickson"
            className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0 border border-slate-200 bg-white"
          />
          <div>
            <strong className="text-sm font-bold tracking-tight text-[#102c4d] block">
              JKR PORT DICKSON
            </strong>
            <small className="block text-[11px] font-semibold tracking-wider text-[#64748b]">
              BAHAGIAN JALAN · SISTEM REKOD SURAT
            </small>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#56718b] bg-[#f8fafc] px-3 py-1.5 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Portal kakitangan dalaman</span>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0d2948] via-[#12365a] to-[#164c78] text-white pt-14 pb-28 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute right-[-100px] top-[-100px] w-[460px] h-[460px] rounded-full border border-white/10 shadow-[0_0_0_80px_rgba(255,255,255,0.03)] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 text-[#f2c86f] text-xs font-bold uppercase tracking-widest mb-3 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-[#f2c86f]" />
            <span>Portal Pengurusan Surat Rasmi</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Setiap surat direkod.<br />
            Setiap tindakan dipantau.
          </h1>

          <p className="text-slate-200 text-sm md:text-base max-w-2xl leading-relaxed">
            Platform berpusat untuk pendaftaran surat masuk, minit arahan Jurutera Jalan,
            agihan tugas kepada pegawai teknikal dan semakan status tindakan dalam tempoh 48 jam.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 -mt-16 mb-16 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Info Column */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-7 md:p-9 border border-[#e5ebf2] shadow-[0_12px_32px_rgba(24,54,74,0.06)]">
          <span className="inline-block px-3 py-1 bg-[#eaf2f9] text-[#24527b] text-xs font-bold rounded-full mb-3 tracking-wide">
            REKOD DIGITAL BAHAGIAN JALAN
          </span>

          <h2 className="text-2xl font-bold text-[#102c4d] mb-2 tracking-tight">
            Urusan surat lebih tersusun
          </h2>

          <p className="text-sm text-[#64748b] leading-relaxed mb-8">
            Semua maklumat surat, minit arahan dan maklum balas pegawai boleh dikesan semula
            tanpa kebergantungan pada carian fail fizikal yang memakan masa.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#152b42] mb-1">
                  Pendaftaran & imbasan surat
                </strong>
                <span className="text-xs text-[#64748b] leading-relaxed block">
                  Catat tajuk surat, rujukan fail, pengirim, tarikh surat dan muat naik imbasan dokumen dengan sistematik.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#152b42] mb-1">
                  Minit arahan & agihan tugas
                </strong>
                <span className="text-xs text-[#64748b] leading-relaxed block">
                  Jurutera Jalan menetapkan pegawai bertanggungjawab, unit tindakan dan arahan siasatan tapak.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#152b42] mb-1">
                  Pemantauan tindakan 48 jam
                </strong>
                <span className="text-xs text-[#64748b] leading-relaxed block">
                  Sistem menandakan surat tertangguh dengan amaran automatik (36j+ & 48j+) bagi memastikan aduan diselesaikan.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daerah Port Dickson, Negeri Sembilan</span>
            <span className="font-semibold text-[#102c4d]">Versi Demonstrasi</span>
          </div>
        </section>

        {/* Auth Box Column */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-7 md:p-8 border border-[#e0e7ef] shadow-[0_20px_50px_rgba(7,33,59,0.14)]">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-[#102c4d] tracking-tight">
              {activeTab === 'login' ? 'Selamat Kembali' : 'Pendaftaran ID Baharu'}
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              {activeTab === 'login'
                ? 'Log masuk menggunakan ID kakitangan untuk mengakses sistem rekod.'
                : 'Cipta akaun kakitangan bagi menguji aliran agihan & tindakan.'}
            </p>
          </div>

          {/* Tab selector */}
          <div className="grid grid-cols-2 p-1 bg-[#f1f5f9] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-[#102c4d] shadow-sm'
                  : 'text-[#64748b] hover:text-[#102c4d]'
              }`}
            >
              Log Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setMessage(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-[#102c4d] shadow-sm'
                  : 'text-[#64748b] hover:text-[#102c4d]'
              }`}
            >
              Daftar ID
            </button>
          </div>

          {/* Quick Demo Login Bar */}
          <div className="mb-5 p-3.5 bg-[#f8fafc] border border-blue-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Log Masuk Pantas (Demo):
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('pka')}
                className="text-left px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-[#1e293b] hover:border-blue-500 hover:text-blue-600 transition"
              >
                PKA Pendaftaran
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('jj')}
                className="text-left px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-[#1e293b] hover:border-blue-500 hover:text-blue-600 transition"
              >
                Jurutera Jalan
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('u0')}
                className="text-left px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-[#1e293b] hover:border-blue-500 hover:text-blue-600 transition"
              >
                En Azmir (Pegawai)
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs leading-relaxed mb-4 ${
                message.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  ID Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Contoh: pka, jj, atau JKRPD001"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1.5">
                  Kata Laluan
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata laluan"
                    className="w-full px-3.5 py-2.5 pr-11 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span>Ingat ID saya</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setMessage({
                      text: 'Dalam mod demonstrasi, anda boleh log masuk terus menggunakan butang Demo Pantas di atas tanpa kata laluan.',
                      isError: false,
                    })
                  }
                  className="text-blue-600 hover:underline font-medium"
                >
                  Lupa kata laluan?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#102942] hover:bg-[#183c60] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <span>Log Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-400 mt-3">
                Akses terhad kepada kakitangan JKR yang dibenarkan sahaja.
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Nama Penuh *
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nama seperti rekod jabatan"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    ID Pengguna *
                  </label>
                  <input
                    type="text"
                    required
                    value={regStaffId}
                    onChange={(e) => setRegStaffId(e.target.value)}
                    placeholder="Contoh: JKRPD010"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    E-mel Rasmi *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@jkr.gov.my"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Jawatan / Peranan *
                  </label>
                  <select
                    required
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                  >
                    <option value="">Pilih jawatan</option>
                    <option value="PKA">Pembantu Khidmat Am (PKA)</option>
                    <option value="Penolong Jurutera">Penolong Jurutera</option>
                    <option value="Penolong Jurutera Kanan">Penolong Jurutera Kanan</option>
                    <option value="Jurutera Jalan">Jurutera Jalan</option>
                    <option value="Lain-lain">Lain-lain kakitangan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">
                    Unit *
                  </label>
                  <select
                    required
                    value={regUnit}
                    onChange={(e) => setRegUnit(e.target.value as RoadUnit)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                  >
                    <option value="">Pilih unit</option>
                    <option value="PTJ Jalan">PTJ Jalan</option>
                    <option value="Jalan Persekutuan">Jalan Persekutuan</option>
                    <option value="Jalan Negeri">Jalan Negeri</option>
                    <option value="Unit Aduan">Unit Aduan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Kata Laluan (min. 8 aksara) *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Cipta kata laluan"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Sahkan Kata Laluan *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cbd5e1] rounded-xl focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#102942] hover:bg-[#183c60] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                <span>Hantar Pendaftaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Prototype Notice */}
          <div className="mt-5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] leading-relaxed text-amber-900">
            <strong className="font-semibold block mb-0.5">Mod Prototaip:</strong>
            Pendaftaran & log masuk demonstrasi disimpan pada pelayar peranti ini. Tiada kata laluan peribadi rasmi diperlukan untuk ujian prototaip.
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        © 2026 Jabatan Kerja Raya · Bahagian Jalan, Port Dickson · Sistem Rekod Surat Rasmi
      </footer>
    </div>
  );
};
