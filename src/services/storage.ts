import { LetterRecord, User, RoadUnit, LetterStatus } from '../types';
import { DEFAULT_USERS, INITIAL_DEMO_RECORDS } from '../constants';

const KEY = 'esurat_jkrpd_v1';
const ACTOR_KEY = 'esurat_actor';
const LANG_KEY = 'esurat_lang';
const ACCOUNT_KEY = 'esurat_demo_accounts_v2';
const SESSION_KEY = 'esurat_demo_session_v2';
const REMEMBER_KEY = 'esurat_remember_id';

export interface StoredAccount extends User {
  salt: string;
  hash: string;
}

export function getStoredAccounts(): StoredAccount[] {
  try {
    const data = localStorage.getItem(ACCOUNT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  const current = getStoredAccounts();
  const filtered = current.filter((a) => a.loginId !== account.loginId && a.id !== account.id);
  filtered.push(account);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(filtered));
}

export function getAllUsers(): User[] {
  const customAccounts = getStoredAccounts().map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    title: a.title,
    email: a.email,
    unit: a.unit,
    loginId: a.loginId,
  }));

  const all = [...DEFAULT_USERS];
  for (const c of customAccounts) {
    if (!all.some((u) => u.id === c.id)) {
      all.push(c);
    }
  }
  return all;
}

export function getStoredRecords(): LetterRecord[] {
  try {
    const data = localStorage.getItem(KEY);
    if (!data) {
      // First time initialization: populate with realistic demo letters
      localStorage.setItem(KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
      return INITIAL_DEMO_RECORDS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredRecords(records: LetterRecord[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error('Storage full or error saving records', err);
    return false;
  }
}

export function getStoredActor(): string {
  return localStorage.getItem(ACTOR_KEY) || 'pka';
}

export function setStoredActor(id: string): void {
  localStorage.setItem(ACTOR_KEY, id);
}

export function getStoredSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function setStoredSession(id: string): void {
  sessionStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getRememberedId(): string {
  return localStorage.getItem(REMEMBER_KEY) || '';
}

export function setRememberedId(loginId: string, remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, loginId);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function getStoredLang(): 'ms' | 'en' {
  const l = localStorage.getItem(LANG_KEY);
  return l === 'en' ? 'en' : 'ms';
}

export function setStoredLang(l: 'ms' | 'en'): void {
  localStorage.setItem(LANG_KEY, l);
}

export function isOverdue(r: LetterRecord): boolean {
  if (['Selesai', 'Difailkan'].includes(r.status)) return false;
  const time = new Date(r.lastProgressAt || r.createdAt).getTime();
  return Date.now() - time > 48 * 3600000;
}

export function isNearDue(r: LetterRecord): boolean {
  if (['Selesai', 'Difailkan'].includes(r.status)) return false;
  const elapsed = Date.now() - new Date(r.lastProgressAt || r.createdAt).getTime();
  return elapsed > 36 * 3600000 && !isOverdue(r);
}

// Password hashing utility using Web Crypto SHA-256
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

// IndexedDB Storage for Attachments
function openAttachmentDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('esurat-jkrpd-attachments', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('files')) {
        req.result.createObjectStore('files');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAttachmentBlob(id: string, file: Blob): Promise<void> {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction('files').objectStore('files').get(id);
    req.onsuccess = () => {
      db.close();
      resolve(req.result || null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function clearAllAttachments(): Promise<void> {
  const db = await openAttachmentDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// CSV Export
export function exportToCSV(records: LetterRecord[], getUserName: (id?: string) => string): void {
  const headers = [
    'ID',
    'Tajuk Surat',
    'No Rujukan Surat',
    'No Rujukan Fail',
    'Pengirim',
    'Tarikh Surat',
    'Tarikh Terima',
    'Masa Daftar',
    'Unit',
    'Pegawai',
    'Status',
    'Arahan',
    'Maklum Balas',
    'Lokasi Fail',
    'Nama Lampiran',
  ];

  const escapeCSV = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const rows = records.map((r) => [
    r.id,
    r.title,
    r.ref,
    r.fileNo,
    r.sender,
    r.letterDate,
    r.receivedDate,
    r.createdAt,
    r.unit || '',
    getUserName(r.assigneeId),
    r.status,
    r.instructions || '',
    r.notes || '',
    r.fileLocation || '',
    r.attachmentName || '',
  ]);

  const csvContent =
    '\ufeff' +
    [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekod_surat_jkr_pd_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// CSV Parsing
export function parseCSV(input: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let v = '';
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        v += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === ',' && !quoted) {
      row.push(v);
      v = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && input[i + 1] === '\n') {
        i++;
      }
      row.push(v);
      if (row.some((x) => x !== '')) {
        out.push(row);
      }
      row = [];
      v = '';
    } else {
      v += c;
    }
  }

  row.push(v);
  if (row.some((x) => x !== '')) {
    out.push(row);
  }
  return out;
}
