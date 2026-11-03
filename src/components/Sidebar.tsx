import React from 'react';
import { ActivePage, Language } from '../types';
import { DICT } from '../constants';
import { LayoutDashboard, FileText, PlusCircle, BarChart3, Settings, ShieldCheck, X } from 'lucide-react';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  lang: Language;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  lang,
  isOpenMobile,
  onCloseMobile,
}) => {
  const t = DICT[lang];

  const navItems: { page: ActivePage; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { page: 'surat', label: t.letters, icon: <FileText className="w-5 h-5" /> },
    { page: 'daftar', label: t.register, icon: <PlusCircle className="w-5 h-5" /> },
    { page: 'laporan', label: t.reports, icon: <BarChart3 className="w-5 h-5" /> },
    { page: 'tetapan', label: t.settings, icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#102942] text-[#d2e2f4] flex flex-col p-6 z-50 transition-transform duration-300 ease-in-out shrink-0 border-r border-[#1e3e5c] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#234768] mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_523558bb.png"
              alt="Logo JKR Port Dickson"
              className="w-11 h-11 rounded-xl object-cover shadow-inner shrink-0 border border-white/20 bg-white"
            />
            <div>
              <strong className="text-white text-base font-bold leading-tight block">
                e-Surat Jalan
              </strong>
              <small className="text-[#92b0cd] text-xs font-semibold tracking-wider block">
                JKR PORT DICKSON
              </small>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Label */}
        <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#7795b3] px-3 mb-2">
          {t.menu}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = activePage === item.page;
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => {
                  onNavigate(item.page);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#23506f] text-white shadow-sm'
                    : 'text-[#c7d8e8] hover:bg-[#193a57] hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-[#93c5fd]' : 'text-[#8daecb]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#234768] text-xs text-[#9eb5cc]">
          <strong className="text-white block font-semibold mb-0.5">Bahagian Jalan</strong>
          <span className="block text-[11px] text-[#7d9ebf] mb-3">JKR Daerah Port Dickson</span>
          <div className="bg-[#173858] p-2.5 rounded-lg text-[10px] text-[#b8d1ea] leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{t.prototype}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
