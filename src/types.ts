export type RoleType = 'pendaftar' | 'jurutera' | 'pelaksana';

export interface User {
  id: string;
  name: string;
  role: RoleType;
  title?: string;
  email?: string;
  unit?: string;
  loginId?: string;
}

export type LetterStatus = 'Baru' | 'Diminitkan' | 'Dalam Tindakan' | 'Selesai' | 'Difailkan';

export type RoadUnit = 'PTJ Jalan' | 'Jalan Persekutuan' | 'Jalan Negeri' | 'Unit Aduan';

export interface HistoryItem {
  when: string;
  by: string; // user ID
  action: string;
}

export interface LetterRecord {
  id: string;
  title: string;
  ref: string;
  fileNo: string;
  sender: string;
  letterDate: string;
  receivedDate: string;
  unit?: string;
  createdAt: string;
  lastProgressAt: string;
  createdBy: string;
  status: LetterStatus;
  assigneeId?: string;
  instructions?: string;
  notes?: string;
  fileLocation?: string;
  attachmentName?: string;
  history: HistoryItem[];
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
export type Language = 'ms' | 'en';
export type ActivePage = 'dashboard' | 'surat' | 'daftar' | 'laporan' | 'tetapan';
