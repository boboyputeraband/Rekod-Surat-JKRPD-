import React from 'react';
import { ActivePage, Language, User } from '../types';
import { DICT } from '../constants';
import { Menu, LogOut, Globe, UserCheck, ShieldAlert } from 'lucide-react';

interface TopbarProps {
  activePage: ActivePage;
  lang: Language;
  onSetLang: (lang: Language) => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activePage,
  lang,
  onSetLang,
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  onOpenMobileSidebar,
}) => {
  const t = DICT[lang];

  const getPageTitle = (p: ActivePage) => {
    switch (p) {
      case 'surat':
        return t.letters;
      case 'daftar':
        return t.register;
      case 'laporan':
        return t.reports;
      case 'tetapan':
        return t.settings;
      default:
        return t.dashboard;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'jurutera') return 'Jurutera Jalan';
    if (role === 'pendaftar') return 'PKA Pendaftaran';
    return 'Pegawai Pelaksana';
  };

  return (
    <header className="bg-white border-b border-[#e1e8f0] px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile menu & Titles */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[11px] font-bold text-[#64748b] tracking-wider uppercase flex items-center gap-1.5">
            <span>JKR PORT DICKSON</span>
            <span className="text-slate-300">/</span>
            <span>BAHAGIAN JALAN</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#102942] tracking-tight leading-tight">
            {getPageTitle(activePage)}
          </h1>
        </div>
      </div>

      {/* Right: Controls & Role Selector */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap justify-end">
        {/* Demo Mode Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>MOD DEMO — BUKAN SISTEM RASMI</span>
        </div>

        {/* Language switcher */}
        <div className="flex items-center border border-[#d5dfea] rounded-lg overflow-hidden bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => onSetLang('ms')}
            className={`px-2.5 py-1.5 transition ${
              lang === 'ms' ? 'bg-[#102942] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            BM
          </button>
          <button
            type="button"
            onClick={() => onSetLang('en')}
            className={`px-2.5 py-1.5 transition ${
              lang === 'en' ? 'bg-[#102942] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Actor / Role Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="text-xs font-semibold bg-white border border-[#cbd5e1] text-[#1e293b] rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs max-w-[200px] truncate"
              title="Simulasi Peranan Pengguna"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} [{getRoleLabel(u.role)}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User avatar indicator */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#eaf1f9] text-[#173b58] font-bold text-xs flex items-center justify-center border border-blue-200">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left hidden lg:block">
            <span className="block text-xs font-bold text-slate-800 leading-tight">
              {currentUser.name}
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">
              {getRoleLabel(currentUser.role)}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cddbeb] bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-[#234f76] text-xs font-bold transition shadow-xs"
          title="Log Keluar"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.logout}</span>
        </button>
      </div>
    </header>
  );
};
