import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString } from './types';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-3.1-flash-lite') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async lookupWord(term: string): Promise<WordEntry> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

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
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      throw new Error('Gemini API returned an empty response');
    }

    const parsed = JSON.parse(cleanJsonString(rawContent));
    return buildWordEntry(parsed, term, `gemini (${this.model})`);
  }
}
