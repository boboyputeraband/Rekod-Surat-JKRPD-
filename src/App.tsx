import React, { useState, useEffect } from 'react';
import { LetterRecord, User, Language, ActivePage } from './types';
import {
  getStoredRecords,
  saveStoredRecords,
  getAllUsers,
  getStoredActor,
  setStoredActor,
  getStoredSession,
  clearStoredSession,
  getStoredLang,
  setStoredLang,
  clearAllAttachments,
} from './services/storage';
import { INITIAL_DEMO_RECORDS } from './constants';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { LetterListView } from './components/LetterListView';
import { LetterFormView } from './components/LetterFormView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LetterDetailModal } from './components/LetterDetailModal';
import { Toast } from './components/Toast';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [records, setRecords] = useState<LetterRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentActorId, setCurrentActorId] = useState<string>('pka');
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [lang, setLang] = useState<Language>('ms');
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const recs = getStoredRecords();
    setRecords(recs);

    const users = getAllUsers();
    setAllUsers(users);

    const savedActor = getStoredActor();
    setCurrentActorId(savedActor);

    const savedLang = getStoredLang();
    setLang(savedLang);

    const session = getStoredSession();
    if (session) {
      setIsAuthenticated(true);
      setCurrentActorId(session);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3800);
  };

  const handleLoginSuccess = (userId: string) => {
    setIsAuthenticated(true);
    setCurrentActorId(userId);
    setAllUsers(getAllUsers());
    showToast('Log masuk berjaya. Selamat datang ke e-Surat Jalan.');
  };

  const handleLogout = () => {
    clearStoredSession();
    setIsAuthenticated(false);
  };

  const handleSwitchUser = (userId: string) => {
    setCurrentActorId(userId);
    setStoredActor(userId);
    const u = allUsers.find((x) => x.id === userId);
    if (u) {
      showToast(`Peranan ditukar kepada: ${u.name}`);
    }
  };

  const handleSetLang = (l: Language) => {
    setLang(l);
    setStoredLang(l);
  };

  const handleSaveNewRecord = (newRecord: LetterRecord) => {
    const updated = [newRecord, ...records];
    setRecords(updated);
    saveStoredRecords(updated);
    setActivePage('surat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateRecord = (updatedRecord: LetterRecord) => {
    const updatedList = records.map((r) =>
      r.id === updatedRecord.id ? updatedRecord : r
    );
    setRecords(updatedList);
    saveStoredRecords(updatedList);
  };

  const handleImportRecords = (newRecords: LetterRecord[]) => {
    const combined = [...newRecords, ...records];
    setRecords(combined);
    saveStoredRecords(combined);
  };

  const handleLoadDemoData = () => {
    if (
      records.length > 0 &&
      !window.confirm('Tambah 5 rekod surat contoh ke dalam senarai sedia ada?')
    ) {
      return;
    }

    const newDemoList = INITIAL_DEMO_RECORDS.map((item, idx) => ({
      ...item,
      id: `S-JKRPD-${Date.now().toString(36).toUpperCase()}-${idx}`,
      createdAt: new Date().toISOString(),
      lastProgressAt: new Date().toISOString(),
    }));

    const combined = [...newDemoList, ...records];
    setRecords(combined);
    saveStoredRecords(combined);
    showToast('5 data surat contoh fiksyen dimasukkan.');
  };

  const handleClearAllData = async () => {
    if (
      !window.confirm(
        'Padam SEMUA rekod surat pada peranti ini? Tindakan ini tidak boleh dibatalkan.'
      )
    ) {
      return;
    }

    setRecords([]);
    saveStoredRecords([]);
    try {
      await clearAllAttachments();
      showToast('Semua rekod dan lampiran setempat berjaya dikosongkan.');
    } catch {
      showToast('Rekod dikosongkan.');
    }
  };

  const currentUser =
    allUsers.find((u) => u.id === currentActorId) || allUsers[0] || {
      id: 'pka',
      name: 'PKA Pendaftaran',
      role: 'pendaftar',
    };

  const selectedRecord = records.find((r) => r.id === selectedLetterId);

  // If not authenticated, show AuthGate landing portal
  if (!isAuthenticated) {
    return <AuthGate onLoginSuccess={handleLoginSuccess} lang={lang} />;
  }

  return (
    <div className="min-h-screen flex bg-[#f3f6fa] text-[#172b42] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lang={lang}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <Topbar
          activePage={activePage}
          lang={lang}
          onSetLang={handleSetLang}
          currentUser={currentUser}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              records={records}
              allUsers={allUsers}
              lang={lang}
              onNavigate={(page) => {
                setActivePage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenRecord={(id) => setSelectedLetterId(id)}
            />
          )}

          {activePage === 'surat' && (
            <LetterListView
              records={records}
              allUsers={allUsers}
              lang={lang}
              onOpenRecord={(id) => setSelectedLetterId(id)}
              onNavigateToRegister={() => {
                setActivePage('daftar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activePage === 'daftar' && (
            <LetterFormView
              currentUser={currentUser}
              lang={lang}
              onSaveRecord={handleSaveNewRecord}
              onCancel={() => {
                setActivePage('surat');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSwitchToPka={() => handleSwitchUser('pka')}
              showToast={showToast}
            />
          )}

          {activePage === 'laporan' && (
            <ReportsView
              records={records}
              allUsers={allUsers}
              lang={lang}
              onOpenRecord={(id) => setSelectedLetterId(id)}
            />
          )}

          {activePage === 'tetapan' && (
            <SettingsView
              records={records}
              allUsers={allUsers}
              lang={lang}
              onImportRecords={handleImportRecords}
              onLoadDemoData={handleLoadDemoData}
              onClearAllData={handleClearAllData}
              showToast={showToast}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="py-5 text-center text-xs text-[#9caaba] border-t border-[#e1e8f0] bg-white">
          e-Surat Jalan • JKR Daerah Port Dickson • Prototaip BRS 2026
        </footer>
      </div>

      {/* Letter Detail Modal */}
      {selectedRecord && (
        <LetterDetailModal
          record={selectedRecord}
          currentUser={currentUser}
          allUsers={allUsers}
          lang={lang}
          onClose={() => setSelectedLetterId(null)}
          onUpdateRecord={handleUpdateRecord}
          onSwitchUser={handleSwitchUser}
          showToast={showToast}
        />
      )}
    </div>
  );
}
