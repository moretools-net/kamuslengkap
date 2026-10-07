import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString } from './types';

export class DeepSeekProvider implements AIProvider {
  name = 'deepseek';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model: string = 'deepseek-chat', baseUrl: string = 'https://api.deepseek.com/chat/completions') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async lookupWord(term: string): Promise<WordEntry> {
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: createLookupPrompt(term) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API Error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('DeepSeek API returned an empty message content');
    }

    const parsed = JSON.parse(cleanJsonString(rawContent));
    return buildWordEntry(parsed, term, `deepseek (${this.model})`);
  }
}
