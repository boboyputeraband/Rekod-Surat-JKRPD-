import React, { useState, useRef, useEffect } from 'react';
import { LetterRecord, User, Language, RoadUnit } from '../types';
import { DICT, UNITS } from '../constants';
import { saveAttachmentBlob } from '../services/storage';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Camera,
  RefreshCw,
  X,
  Trash2,
  SwitchCamera,
  Check,
  Smartphone,
  Sparkles,
  Loader2,
} from 'lucide-react';

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

  // Auto-scan OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Live Camera Viewfinder State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPka = currentUser.role === 'pendaftar';

  // Helper to convert File/Blob to base64
  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  };

  // Perform Automatic Document Scanning & Extraction
  const scanDocument = async (targetFile: File | Blob) => {
    setIsScanning(true);
    showToast('🔍 Mengimbas dokumen surat secara automatik...');

    try {
      const base64Data = await fileToBase64(targetFile);
      const mime = targetFile.type || 'image/jpeg';

      const response = await fetch('/api/scan-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType: mime }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengekstrak maklumat surat.');
      }

      const { data } = result;

      // Extract strictly and only the 3 requested fields: Tajuk Surat, No. Rujukan Surat, and No. Rujukan Fail
      if (data.title) setTitle(data.title);
      if (data.ref) setRef(data.ref);
      if (data.fileNo) setFileNo(data.fileNo);

      setAutoFilled(true);
      showToast('✨ Tajuk, No. Rujukan Surat & No. Fail berjaya diimbas!');
    } catch (err: any) {
      console.warn('Auto-scan error:', err);
      showToast('Imbasan automatik tidak berjaya: ' + (err.message || 'Sila isi secara manual'));
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

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

    // Automatically trigger AI extraction
    scanDocument(selected);
  };

  const handleClearAttachment = () => {
    setFile(null);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setAutoFilled(false);
    setAiSummary(null);
    showToast('Lampiran telah dipadam.');
  };

  // Live Camera Functions
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startLiveCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopLiveCamera();
    setCameraError(null);
    setIsCameraStarting(true);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Pelayar ini tidak menyokong akses kamera terus.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
      } catch (fallbackErr: any) {
        setCameraError(
          'Tidak dapat mengakses kamera. Sila pastikan kebenaran kamera telah dibenarkan dalam pelayar anda.'
        );
      }
    } finally {
      setIsCameraStarting(false);
    }
  };

  const openLiveCameraModal = () => {
    setIsLiveCameraOpen(true);
    startLiveCamera(facingMode);
  };

  const closeLiveCameraModal = () => {
    stopLiveCamera();
    setIsLiveCameraOpen(false);
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      showToast('Kamera belum bersedia.');
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast('Gagal merakam gambar.');
          return;
        }
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPhotoUrl(previewUrl);
        stopLiveCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  const retakeSnapshot = () => {
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startLiveCamera(facingMode);
  };

  const confirmCapturedPhoto = () => {
    if (!capturedBlob) return;

    const fileName = `imbasan_surat_${Date.now()}.jpg`;
    const photoFile = new File([capturedBlob], fileName, { type: 'image/jpeg' });

    setFile(photoFile);
    setFilePreview(capturedPhotoUrl);
    closeLiveCameraModal();

    // Trigger automatic OCR scanning on captured photo
    scanDocument(photoFile);
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

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
            action: `Surat didaftarkan oleh ${currentUser.name} (${currentUser.title || 'PKA'})${
              autoFilled ? ' [Tajuk, No. Rujukan & No. Fail diimbas automatik]' : ''
            }`,
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
      {/* Hidden canvas for snapshot */}
      <canvas ref={canvasRef} className="hidden" />

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
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h2 className="text-base font-bold text-[#102942]">
            Maklumat Surat & Fail
          </h2>
          {autoFilled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Diimbas Automatik dari Dokumen</span>
            </span>
          )}
        </div>

        {/* AI Scanning Active Indicator */}
        {isScanning && (
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-3.5 text-blue-900 text-xs shadow-xs animate-pulse">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div>
              <strong className="block font-bold text-sm">
                Sedang Mengimbas Tajuk, No. Rujukan Surat & No. Fail...
              </strong>
              <span className="text-slate-600">
                Pengimbas AI sedang membaca 3 maklumat utama ini secara automatik daripada imej surat yang dimuat naik.
              </span>
            </div>
          </div>
        )}

        {/* Auto-filled Success Summary Card */}
        {autoFilled && !isScanning && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-950 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <strong className="block text-sm font-bold text-emerald-900">
                  Tajuk Surat, No. Rujukan Surat & No. Fail Berjaya Diimbas!
                </strong>
                <span className="text-[11px] text-emerald-800 block">
                  3 maklumat ini telah diisi secara automatik. Sila semak atau lengkapkan medan Pengirim dan Unit sekiranya perlu sebelum menyimpan.
                </span>
              </div>
            </div>

            {file && (
              <button
                type="button"
                onClick={() => scanDocument(file)}
                disabled={isScanning}
                className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Imbas Semula</span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#435a72]">
                {t.title} <span className="text-red-500">*</span>
              </label>
              {autoFilled && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  ✨ Imbasan AI
                </span>
              )}
            </div>
            <input
              type="text"
              required
              maxLength={250}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Aduan kerosakan jalan berlubang di FT005 Pasir Panjang"
              className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition ${
                autoFilled ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#d9e2eb]'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#435a72]">
                  {t.ref} <span className="text-red-500">*</span>
                </label>
                {autoFilled && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ✨ Imbasan AI
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={100}
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Contoh: JKR.PD/FT005/01/2026(04)"
                className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl focus:border-blue-500 outline-none transition ${
                  autoFilled ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#d9e2eb]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#435a72]">
                  {t.fileno} <span className="text-red-500">*</span>
                </label>
                {autoFilled && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ✨ Imbasan AI
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={100}
                value={fileNo}
                onChange={(e) => setFileNo(e.target.value)}
                placeholder="Contoh: JKR.PD/FAIL/JLN-FT005-01"
                className={`w-full px-3.5 py-2.5 text-xs bg-white border rounded-xl focus:border-blue-500 outline-none transition ${
                  autoFilled ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#d9e2eb]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#435a72]">
                  {t.sender} <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="text"
                required
                maxLength={160}
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="Contoh: Majlis Perbandaran Port Dickson (MPPD)"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#435a72]">
                  {t.unit}
                </label>
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as RoadUnit | '')}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none transition"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#435a72]">
                  {t.dateletter} <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="date"
                required
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d9e2eb] rounded-xl focus:border-blue-500 outline-none transition"
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

          {/* Attachment & Live Camera Section with Auto-Scan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#435a72]">
                {t.upload}
              </label>
              <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Imbas Surat Diaktifkan</span>
              </span>
            </div>

            <div className="p-4 md:p-5 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-2xl space-y-4">
              {/* Action Buttons: Live Camera, Phone Camera Shutter, File Upload */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Live Camera In-App Viewfinder (Interactive with Guide) */}
                <button
                  type="button"
                  onClick={openLiveCameraModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Kamera Langsung (Live)</span>
                </button>

                {/* 2. Direct Phone Camera (opens native camera app on Android/iOS) */}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Kamera Telefon (Shutter)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* 3. File / PDF Picker */}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Pilih Fail Dokumen</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* 4. Manual Auto-Scan Button */}
                {file && (
                  <button
                    type="button"
                    onClick={() => scanDocument(file)}
                    disabled={isScanning}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    )}
                    <span>{isScanning ? 'Sedang Mengimbas...' : 'Imbas Dokumen Ini (AI)'}</span>
                  </button>
                )}
              </div>

              {/* Status and Hint */}
              <div className="text-xs text-slate-500 leading-relaxed">
                {file ? (
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAttachment}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-xs font-bold rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Padam Fail</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>
                      Apabila gambar surat dimuat naik atau ditangkap melalui kamera telefon, sistem akan <b>mengimbas dan mengisi tajuk, rujukan, pengirim dan tarikh secara automatik</b>.
                    </span>
                  </div>
                )}
              </div>

              {/* Attachment Preview */}
              {filePreview && (
                <div className="pt-3 border-t border-slate-200 flex items-start gap-4">
                  <img
                    src={filePreview}
                    alt="Pratonton Dokumen"
                    className="w-24 h-24 object-cover rounded-xl border border-slate-300 shadow-sm"
                  />
                  <div className="text-xs text-slate-600 space-y-1">
                    <strong className="block text-slate-800 font-bold">
                      Pratonton Dokumen Surat
                    </strong>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dokumen sedia untuk disimpan bersama rekod ini ke dalam sistem rekod JKR.
                    </p>
                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => scanDocument(file!)}
                        disabled={isScanning}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Imbas Semula Dokumen</span>
                      </button>
                    </div>
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
            disabled={!isPka || isSubmitting || isScanning}
            className="px-5 py-2.5 bg-[#205ebc] hover:bg-[#184b96] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : t.save}</span>
          </button>
        </div>
      </form>

      {/* LIVE CAMERA CAPTURE MODAL */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-tight">Kamera Langsung Imbasan Surat</h3>
              </div>
              <button
                type="button"
                onClick={closeLiveCameraModal}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder / Captured Photo Display */}
            <div className="relative bg-black aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center overflow-hidden">
              {capturedPhotoUrl ? (
                /* Captured Photo Review Mode */
                <img
                  src={capturedPhotoUrl}
                  alt="Tangkapan Gambar"
                  className="w-full h-full object-contain"
                />
              ) : (
                /* Live Video Feed Mode */
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Frame Overlay */}
                  <div className="absolute inset-5 sm:inset-8 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                    <div className="flex justify-between text-[11px] font-bold text-emerald-300 bg-black/40 px-2 py-1 rounded-md self-center">
                      Selaraskan surat dalam bingkai ini untuk imbasan
                    </div>
                    {/* Corner Guides */}
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>

                  {isCameraStarting && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-2 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span>Menyambung ke kamera peranti...</span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center text-white gap-3">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <p className="text-xs text-red-200 max-w-sm">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => startLiveCamera(facingMode)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        Cuba Semula
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-white gap-3">
              {capturedPhotoUrl ? (
                /* Controls for Review */
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={retakeSnapshot}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Tangkap Semula</span>
                  </button>

                  <button
                    type="button"
                    onClick={confirmCapturedPhoto}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Guna & Imbas Automatik</span>
                  </button>
                </div>
              ) : (
                /* Controls for Live Camera */
                <div className="flex items-center justify-between w-full">
                  {/* Switch Rear / Front Camera button */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Tukar Kamera Depan/Belakang"
                    className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>

                  {/* Big Shutter Button */}
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    disabled={isCameraStarting || !!cameraError}
                    className="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center transition shadow-lg active:scale-95"
                    title="Tangkap Gambar"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20" />
                  </button>

                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={closeLiveCameraModal}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
