import { WordEntry } from '../../types';
import { SYSTEM_PROMPT, createLookupPrompt } from './prompts';
import { AIProvider, buildWordEntry, cleanJsonString } from './types';

export class CloudflareGatewayProvider implements AIProvider {
  name = 'cloudflare_gateway';
  private accountId: string;
  private gatewayId: string;
  private apiKey: string;
  private targetProvider: 'deepseek' | 'gemini' | 'openai';
  private model: string;

  constructor(
    accountId: string,
    gatewayId: string,
    apiKey: string,
    targetProvider: 'deepseek' | 'gemini' | 'openai' = 'deepseek',
    model: string = 'deepseek-chat'
  ) {
    this.accountId = accountId;
    this.gatewayId = gatewayId;
    this.apiKey = apiKey;
    this.targetProvider = targetProvider;
    this.model = model;
  }

  async lookupWord(term: string): Promise<WordEntry> {
    const providerPath = this.targetProvider === 'deepseek'
      ? 'deepseek/v1/chat/completions'
      : this.targetProvider === 'gemini'
        ? 'google-ai-studio/v1/chat/completions'
        : 'openai/chat/completions';

    const gatewayEndpoint = `https://gateway.ai.cloudflare.com/v1/${this.accountId}/${this.gatewayId}/${providerPath}`;

    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: createLookupPrompt(term) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    };

    const response = await fetch(gatewayEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare AI Gateway Error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('Cloudflare AI Gateway returned an empty message content');
    }

    const parsed = JSON.parse(cleanJsonString(rawContent));
    return buildWordEntry(parsed, term, `cloudflare_gateway (${this.targetProvider})`);
  }
}
