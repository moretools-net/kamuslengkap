import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString, parsePartialJson } from './types';

export class WorkersAIProvider implements AIProvider {
  name = 'workers_ai';
  private aiBinding: any;
  private model: string;

  constructor(aiBinding: any, model: string = '@cf/meta/llama-3.2-3b-instruct') {
    this.aiBinding = aiBinding;
    this.model = model;
  }

  async lookupWord(term: string): Promise<WordEntry> {
    if (!this.aiBinding) {
      throw new Error('Cloudflare Workers AI binding [env.AI] is not configured in wrangler.toml');
    }

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + '\nPENTING: Kembalikan HANYA format JSON valid tanpa penjelasan tambahan dan tanpa markdown fence.',
      },
      { role: 'user', content: createLookupPrompt(term) },
    ];

    const result = await this.aiBinding.run(this.model, {
      messages,
      temperature: 0.1,
      max_tokens: 2048,
    });

    // 1. Jika Workers AI runtime sudah mem-parse field `response` menjadi object, langsung gunakan!
    if (result?.response && typeof result.response === 'object' && !Array.isArray(result.response)) {
      return buildWordEntry(result.response, term, `workers_ai (${this.model})`);
    }

    let rawContent: string | null = null;

    // 2. Format OpenAI-compatible
    if (result?.choices?.[0]?.message?.content) {
      rawContent = result.choices[0].message.content;
    }
    // 3. Field response berupa string
    else if (typeof result?.response === 'string') {
      rawContent = result.response;
    }
    // 4. Streaming
    else if (result && typeof result === 'object' && result[Symbol.asyncIterator]) {
      const chunks: string[] = [];
      for await (const chunk of result as AsyncIterable<any>) {
        if (chunk?.response) chunks.push(chunk.response);
        else if (chunk?.choices?.[0]?.delta?.content) chunks.push(chunk.choices[0].delta.content);
      }
      rawContent = chunks.join('');
    }

    if (!rawContent || rawContent.trim() === '') {
      throw new Error(`Workers AI returned unrecognized response format: ${JSON.stringify(result)}`);
    }

    const cleaned = cleanJsonString(rawContent);
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Jika JSON terpotong / ada kesalahan sintaks, pulihkan data penting dengan regex parser
      parsed = parsePartialJson(cleaned, term);
    }

    return buildWordEntry(parsed, term, `workers_ai (${this.model})`);
  }
}
