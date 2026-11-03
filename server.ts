import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side GoogleGenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint to scan and extract letter information with AI
app.post('/api/scan-letter', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imej dokumen surat diperlukan untuk imbasan.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Kunci API GEMINI_API_KEY belum dikonfigurasikan.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: `Anda ialah sistem OCR Jabatan Kerja Raya (JKR) Port Dickson, Bahagian Jalan.
Tugasan anda adalah KHAS untuk mengekstrak HANYA 3 maklumat berikut daripada imej dokumen surat rasmi yang diberikan:

1. title: Tajuk surat atau perkara utama surat (contoh: "Aduan Kerosakan Jalan Berlubang di FT005 Pasir Panjang").
2. ref: Nombor rujukan surat rasmi (contoh: "JKR.PD/FT005/01/2026(04)" atau rujukan surat pengirim).
3. fileNo: Nombor rujukan fail yang dicatatkan pada kepala/kaki surat (contoh: "JKR.PD/FAIL/..."). Jika tiada nombor fail eksplisit, buat cadangan nombor rujukan fail yang bersesuaian dengan tajuk dokumen.

PENTING: Jangan imbas atau ubah maklumat lain. Ekstrak HANYA tajuk surat, nombor rujukan surat, dan nombor rujukan fail.`,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Tajuk surat rasmi' },
            ref: { type: Type.STRING, description: 'Nombor rujukan surat' },
            fileNo: { type: Type.STRING, description: 'Nombor rujukan fail' },
          },
          required: ['title', 'ref', 'fileNo'],
        },
      },
    });

    const resultText = response.text || '{}';
    const parsedData = JSON.parse(resultText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/scan-letter:', error);
    return res.status(500).json({
      error: error.message || 'Ralat semasa memproses dokumen surat.',
    });
  }
});

// Server boot with Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server e-Surat Jalan running on port ${port}`);
  });
}

startServer();
