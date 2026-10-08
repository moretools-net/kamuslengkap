import { Env, WordEntry } from '../../types';
import { CloudflareGatewayProvider } from './cloudflare-gateway';
import { DeepSeekProvider } from './deepseek';
import { GeminiProvider } from './gemini';
import { AIProvider, slugify } from './types';
import { WorkersAIProvider } from './workers-ai';

class DemoProvider implements AIProvider {
  name = 'demo_fallback';

  async lookupWord(term: string): Promise<WordEntry> {
    const slug = slugify(term);
    return {
      slug,
      term,
      language_code: 'id',
      language_name: 'Bahasa Indonesia',
      language_flag: '🇮🇩',
      tags: ['Istilah', 'Demonstrasi'],
      category: 'Istilah',
      formality: 'Netral',
      phonetic: `/${term.toLowerCase()}/`,
      definition_short: `Makna dan penjelasan mengenai kata atau istilah "${term}".`,
      definition_full: `Entri ini adalah tampilan demonstrasi karena belum ada AI yang aktif. Set konfigurasi di .dev.vars untuk mengaktifkan definisi lengkap.`,
      examples: [
        {
          original: `Contoh penggunaan kata "${term}" dalam kalimat.`,
          translation: `Terjemahan contoh kalimat "${term}".`,
        },
      ],
      synonyms: ['istilah terkait', 'sinonim'],
      antonyms: [],
      cultural_context: `Istilah "${term}" banyak digunakan dalam percakapan kontemporer.`,
      provider_used: 'demo (belum ada API Key aktif)',
    };
  }
}

/**
 * FallbackChainProvider
 *
 * Menjalankan provider secara berurutan.
 * Jika Provider A error (API down, kuota habis, timeout, dsb.),
 * otomatis beralih ke Provider B, lalu C, dan seterusnya.
 * Pengunjung tidak akan pernah melihat error selama ada ≥1 provider aktif.
 */
export class FallbackChainProvider implements AIProvider {
  name = 'dynamic_fallback_chain';
  private chain: AIProvider[];

  constructor(chain: AIProvider[]) {
    this.chain = chain;
  }

  async lookupWord(term: string): Promise<WordEntry> {
    const errorLogs: string[] = [];

    for (const provider of this.chain) {
      try {
        console.log(`[AI Chain] Mencoba: ${provider.name}...`);
        const result = await provider.lookupWord(term);
        console.log(`[AI Chain] Berhasil via: ${provider.name}`);
        return result;
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.warn(`[AI Chain] ${provider.name} gagal: ${msg}`);
        errorLogs.push(`${provider.name}: ${msg}`);
      }
    }

    throw new Error(`Semua AI provider gagal: ${errorLogs.join(' | ')}`);
  }
}

/**
 * buildProviderChain
 *
 * Membangun daftar provider berdasarkan API Key yang tersedia.
 *
 * Urutan prioritas default (dari paling diutamakan):
 *   1. Gemini langsung (jika GEMINI_API_KEY ada)
 *   2. DeepSeek via CF Gateway (jika DEEPSEEK_API_KEY + CF_GATEWAY_ID ada)
 *   3. DeepSeek langsung (jika DEEPSEEK_API_KEY ada)
 *   4. Gemini via CF Gateway (jika GEMINI_API_KEY + CF_GATEWAY_ID ada)
 *   5. Cloudflare Workers AI (jika env.AI binding tersedia)
 *
 * Urutan bisa dipengaruhi oleh AI_PROVIDER di .dev.vars:
 *   - AI_PROVIDER=gemini    → Gemini diletakkan pertama
 *   - AI_PROVIDER=deepseek  → DeepSeek diletakkan pertama
 *   - AI_PROVIDER=workers_ai→ Workers AI diletakkan pertama
 */
export function getAIProvider(env: Env): AIProvider {
  const preferred = (env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  const hasGemini = !!(env.GEMINI_API_KEY?.trim());
  const hasDeepSeek = !!(env.DEEPSEEK_API_KEY?.trim());
  const hasCFGateway = !!(env.CF_ACCOUNT_ID?.trim() && env.CF_GATEWAY_ID?.trim());
  const hasWorkersAI = !!env.AI;

  const allProviders: Array<{ priority: number; provider: AIProvider }> = [];

  // --- Gemini Direct ---
  if (hasGemini) {
    allProviders.push({
      priority: preferred === 'gemini' ? 1 : 3,
      provider: new GeminiProvider(
        env.GEMINI_API_KEY!.trim(),
        env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
      ),
    });
  }

  // --- DeepSeek via Cloudflare AI Gateway ---
  if (hasDeepSeek && hasCFGateway) {
    allProviders.push({
      priority: preferred === 'cloudflare_gateway' ? 1 : preferred === 'deepseek' ? 2 : 4,
      provider: new CloudflareGatewayProvider(
        env.CF_ACCOUNT_ID!.trim(),
        env.CF_GATEWAY_ID!.trim(),
        env.DEEPSEEK_API_KEY!.trim(),
        'deepseek',
        env.DEEPSEEK_MODEL || 'deepseek-chat'
      ),
    });
  }

  // --- DeepSeek Direct ---
  if (hasDeepSeek) {
    allProviders.push({
      priority: preferred === 'deepseek' ? 1 : 5,
      provider: new DeepSeekProvider(
        env.DEEPSEEK_API_KEY!.trim(),
        env.DEEPSEEK_MODEL || 'deepseek-chat'
      ),
    });
  }

  // --- Gemini via Cloudflare AI Gateway ---
  if (hasGemini && hasCFGateway) {
    allProviders.push({
      priority: preferred === 'cloudflare_gateway' && !hasDeepSeek ? 1 : 6,
      provider: new CloudflareGatewayProvider(
        env.CF_ACCOUNT_ID!.trim(),
        env.CF_GATEWAY_ID!.trim(),
        env.GEMINI_API_KEY!.trim(),
        'gemini',
        env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
      ),
    });
  }

  // --- Cloudflare Workers AI (selalu terakhir, fallback gratis) ---
  if (hasWorkersAI) {
    allProviders.push({
      priority: preferred === 'workers_ai' ? 1 : 99,
      provider: new WorkersAIProvider(
        env.AI,
        env.WORKERS_AI_MODEL || '@cf/meta/llama-3.2-3b-instruct'
      ),
    });
  }

  // Tidak ada satupun provider yang terkonfigurasi
  if (allProviders.length === 0) {
    return new DemoProvider();
  }

  // Urutkan berdasarkan prioritas
  allProviders.sort((a, b) => a.priority - b.priority);
  const chain = allProviders.map((p) => p.provider);

  // Jika hanya 1 provider, kembalikan langsung tanpa wrapper
  if (chain.length === 1) return chain[0];

  return new FallbackChainProvider(chain);
}
