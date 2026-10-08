import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private candidateModels: string[];

  constructor(apiKey: string, model: string = 'gemini-3.5-flash') {
    this.apiKey = apiKey;
    // Daftar model alternatif jika model utama terkena rate limit (429) atau kuota habis:
    const models = [model, 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
    this.candidateModels = [...new Set(models.filter(Boolean))];
  }

  async lookupWord(term: string): Promise<WordEntry> {
    let lastError: Error | null = null;

    for (const model of this.candidateModels) {
      try {
        return await this.fetchWithModel(term, model);
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${model} gagal: ${err?.message ?? err}. Mencoba model alternatif...`);
      }
    }

    throw lastError || new Error('Semua model Gemini gagal.');
  }

  private async fetchWithModel(term: string, model: string): Promise<WordEntry> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

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
      throw new Error(`Gemini API Error (${response.status}) on model ${model}: ${errText}`);
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
