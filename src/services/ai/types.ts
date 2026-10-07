import { WordEntry } from '../../types';
import { resolveLanguageMeta } from './language-map';

export interface AIProvider {
  name: string;
  lookupWord(term: string): Promise<WordEntry>;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Pembersih string JSON agar tahan terhadap respons LLM:
 * - Menghilangkan backtick markdown
 * - Mengekstrak substring antara kurung kurawal pertama { dan terakhir }
 * - Menghapus trailing comma sebelum } atau ]
 */
export function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();

  // 1. Bersihkan markdown code fence
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // 2. Ekstrak hanya bagian JSON {} terluar
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Bersihkan trailing commas sebelum } atau ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  return cleaned.trim();
}

/**
 * Fallback parser berbasis Regex jika JSON.parse gagal akibat token terpotong atau koma hilang.
 */
export function parsePartialJson(text: string, defaultTerm: string): Record<string, any> {
  const result: Record<string, any> = { term: defaultTerm };

  const extractString = (key: string) => {
    const match = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`, 'i'));
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
  };

  result.term = extractString('term') || defaultTerm;
  result.language_code = extractString('language_code') || 'id';
  result.phonetic = extractString('phonetic') || '';
  result.definition_short = extractString('definition_short') || '';
  result.definition_full = extractString('definition_full') || result.definition_short;
  result.cultural_context = extractString('cultural_context') || '';

  // Ekstrak tags array
  const tagsMatch = text.match(/"tags"\s*:\s*\[([^\]]*)\]/i);
  if (tagsMatch) {
    const rawItems = tagsMatch[1].match(/"([^"]+)"/g);
    if (rawItems) {
      result.tags = rawItems.map((s) => s.replace(/"/g, ''));
    }
  }

  // Ekstrak contoh kalimat sederhana
  const examples: Array<{ original: string; translation: string }> = [];
  const origMatches = [...text.matchAll(/"original"\s*:\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"/gi)];
  const transMatches = [...text.matchAll(/"translation"\s*:\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"/gi)];
  for (let i = 0; i < origMatches.length; i++) {
    examples.push({
      original: origMatches[i][1].replace(/\\"/g, '"'),
      translation: transMatches[i]?.[1]?.replace(/\\"/g, '"') || '',
    });
  }
  if (examples.length > 0) result.examples = examples;

  // Ekstrak sinonim
  const synMatch = text.match(/"synonyms"\s*:\s*\[([^\]]*)\]/i);
  if (synMatch) {
    const raw = synMatch[1].match(/"([^"]+)"/g);
    if (raw) result.synonyms = raw.map((s) => s.replace(/"/g, ''));
  }

  return result;
}

/**
 * Membersihkan dan memecah nilai tag agar tidak ada lagi format garis miring
 * seperti "Informal / Gaul" atau "Formal / Baku".
 * Menghasilkan array tag bersih dan unik.
 */
export function sanitizeTags(rawTags: unknown, additionalSources: (string | undefined)[] = []): string[] {
  const result: string[] = [];

  const add = (val: string) => {
    if (!val || typeof val !== 'string') return;
    // Pecah jika ada pemisah seperti '/', '|', atau koma ganda
    const parts = val.split(/[/|,]+/);
    for (const p of parts) {
      const clean = p.trim();
      if (clean && clean.length >= 2 && clean.length <= 30 && !result.some((r) => r.toLowerCase() === clean.toLowerCase())) {
        result.push(clean);
      }
    }
  };

  if (Array.isArray(rawTags)) {
    for (const item of rawTags) {
      if (typeof item === 'string') add(item);
    }
  } else if (typeof rawTags === 'string') {
    add(rawTags);
  }

  for (const src of additionalSources) {
    if (src) add(src);
  }

  return result.length > 0 ? result : ['Istilah'];
}

/**
 * Standardizer untuk membangun objek WordEntry dari respons JSON AI apa saja.
 */
export function buildWordEntry(
  parsed: Record<string, any>,
  fallbackTerm: string,
  providerLabel: string
): WordEntry {
  const termClean = (parsed.term || fallbackTerm).trim();
  const langCode = (parsed.language_code || 'id').toLowerCase().trim();
  const langMeta = resolveLanguageMeta(langCode, parsed.language_name);

  // Kumpulkan tag dari 'tags', 'category', dan 'formality'
  // Semua yang mengandung garis miring akan dipecah otomatis menjadi tag individual
  const tags = sanitizeTags(parsed.tags, [
    parsed.language_variant,
    parsed.category,
    parsed.formality,
  ]);

  return {
    slug: slugify(termClean),
    term: termClean,
    language_code: langMeta.code,
    language_name: langMeta.name,
    language_flag: langMeta.flag,
    tags,
    category: tags[0] || 'Kata / Istilah',
    formality: tags.find((t) => /formal|informal|baku|gaul|santai|kasar|netral/i.test(t)) || 'Netral',
    phonetic: parsed.phonetic || '',
    definition_short: parsed.definition_short || '',
    definition_full: parsed.definition_full || '',
    examples: Array.isArray(parsed.examples) ? parsed.examples : [],
    synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
    antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
    cultural_context: parsed.cultural_context || '',
    provider_used: providerLabel,
  };
}
