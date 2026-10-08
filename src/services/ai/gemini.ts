import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKeys: string[];
  private candidateModels: string[];

  constructor(apiKeys: string | string[], model: string = 'gemini-3.5-flash') {
    // Dukung input single key, array, atau string dipisah koma / newline:
    if (Array.isArray(apiKeys)) {
      this.apiKeys = apiKeys.map((k) => k.trim()).filter(Boolean);
    } else {
      this.apiKeys = (apiKeys || '')
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean);
    }

    // Model alternatif jika model utama terkena rate limit / kuota habis:
    const models = [model, 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
    this.candidateModels = [...new Set(models.filter(Boolean))];
  }

  async lookupWord(term: string): Promise<WordEntry> {
    if (this.apiKeys.length === 0) {
      throw new Error('Tidak ada GEMINI_API_KEY yang terkonfigurasi');
    }

    // Distribusikan traffic secara acak (Round-Robin/Load Balancing)
    // agar kuota terbagi rata dan tidak bertumpu pada key pertama saja
    const startIndex = Math.floor(Math.random() * this.apiKeys.length);
    const orderedKeys = [
      ...this.apiKeys.slice(startIndex),
      ...this.apiKeys.slice(0, startIndex),
    ];

    let lastError: Error | null = null;

    // 1. Loop setiap API Key yang tersedia
    for (let keyIdx = 0; keyIdx < orderedKeys.length; keyIdx++) {
      const currentKey = orderedKeys[keyIdx];
      const maskedKey = currentKey.length > 8 
        ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`
        : '***';

      // 2. Loop setiap model pilihan (flash -> flash-lite)
      for (const model of this.candidateModels) {
        try {
          return await this.fetchWithModel(term, model, currentKey);
        } catch (err: any) {
          lastError = err;
          const status = err?.status;
          const msg = err?.message ?? String(err);

          console.warn(`[Gemini] Key ${maskedKey} dengan model ${model} gagal (${status ?? 'ERR'}): ${msg}`);

          // Jika API Key tidak valid (401/403) atau quota per-key habis total (429),
          // jangan buang waktu mencoba model lain di key yang sama, langsung pindah ke key berikutnya!
          if (status === 401 || status === 403 || (status === 429 && msg.includes('Quota exceeded'))) {
            console.warn(`[Gemini] Beralih ke API Key berikutnya karena status ${status}`);
            break; // keluar dari loop model, lanjut ke key berikutnya
          }
        }
      }
    }

    throw lastError || new Error('Semua API Key dan model Gemini gagal.');
  }

  private async fetchWithModel(term: string, model: string, apiKey: string): Promise<WordEntry> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: createLookupPrompt(term) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: 'application/json',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      const error: any = new Error(`Gemini API Error (${response.status}) on model ${model}: ${errText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json() as any;
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error(`Gemini API returned an empty response on model ${model}`);
    }

    const parsed = JSON.parse(cleanJsonString(rawContent));
    return buildWordEntry(parsed, term, `gemini (${model})`);
  }
}
