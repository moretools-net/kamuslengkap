import { Language, WordEntry } from '../types';
import { resolveLanguageMeta } from './ai/language-map';
import { sanitizeTags } from './ai/types';

function mapRowToWordEntry(row: any): WordEntry {
  const langMeta = resolveLanguageMeta(row.language_code, row.lang_name);

  // Parse tags_json, atau ambil dari category/formality lama jika baris lama belum punya tags_json
  let parsedTags: string[] = [];
  if (row.tags_json) {
    try {
      parsedTags = JSON.parse(row.tags_json);
    } catch {
      parsedTags = [];
    }
  }

  const tags = sanitizeTags(parsedTags, [
    row.language_variant,
    row.category,
    row.formality,
  ]);

  return {
    slug: row.slug,
    term: row.term,
    language_code: langMeta.code,
    language_name: row.lang_name || langMeta.name,
    language_flag: row.lang_flag || langMeta.flag,
    tags,
    category: tags[0] || 'Istilah',
    formality: tags.find((t) => /formal|informal|baku|gaul|santai|kasar|netral/i.test(t)) || 'Netral',
    phonetic: row.phonetic || '',
    definition_short: row.definition_short || '',
    definition_full: row.definition_full || '',
    examples: row.examples_json ? JSON.parse(row.examples_json) : [],
    synonyms: row.synonyms_json ? JSON.parse(row.synonyms_json) : [],
    antonyms: row.antonyms_json ? JSON.parse(row.antonyms_json) : [],
    cultural_context: row.cultural_context || '',
    search_count: row.search_count || 1,
    provider_used: row.provider_used || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getWordBySlug(db: D1Database, slug: string): Promise<WordEntry | null> {
  if (!db) return null;
  try {
    const row = await db
      .prepare(`
        SELECT 
          w.*,
          l.name AS lang_name,
          l.flag_emoji AS lang_flag
        FROM words w
        LEFT JOIN languages l ON w.language_code = l.code
        WHERE w.slug = ?
        LIMIT 1
      `)
      .bind(slug)
      .first<any>();

    if (!row) return null;
    return mapRowToWordEntry(row);
  } catch (err) {
    console.error('Error fetching word from D1:', err);
    return null;
  }
}

export async function saveWord(db: D1Database, entry: WordEntry): Promise<void> {
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO words (
        slug, term, language_code, tags_json, category, formality, phonetic,
        definition_short, definition_full, examples_json, synonyms_json, antonyms_json,
        cultural_context, search_count, provider_used, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        term = excluded.term,
        language_code = excluded.language_code,
        tags_json = excluded.tags_json,
        category = excluded.category,
        formality = excluded.formality,
        phonetic = excluded.phonetic,
        definition_short = excluded.definition_short,
        definition_full = excluded.definition_full,
        examples_json = excluded.examples_json,
        synonyms_json = excluded.synonyms_json,
        antonyms_json = excluded.antonyms_json,
        cultural_context = excluded.cultural_context,
        search_count = words.search_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `);

    await stmt
      .bind(
        entry.slug,
        entry.term,
        entry.language_code || 'id',
        JSON.stringify(entry.tags || []),
        entry.tags?.[0] || entry.category || 'Istilah',
        entry.formality || 'Netral',
        entry.phonetic || '',
        entry.definition_short || '',
        entry.definition_full || '',
        JSON.stringify(entry.examples || []),
        JSON.stringify(entry.synonyms || []),
        JSON.stringify(entry.antonyms || []),
        entry.cultural_context || '',
        entry.search_count || 1,
        entry.provider_used || ''
      )
      .run();
  } catch (err) {
    console.error('Error saving word to D1:', err);
  }
}

export async function incrementSearchCount(db: D1Database, slug: string): Promise<void> {
  if (!db) return;
  try {
    await db
      .prepare('UPDATE words SET search_count = search_count + 1, updated_at = CURRENT_TIMESTAMP WHERE slug = ?')
      .bind(slug)
      .run();
  } catch (err) {
    console.error('Error incrementing search count:', err);
  }
}

export async function getPopularWords(db: D1Database, limit: number = 10): Promise<WordEntry[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare(`
        SELECT 
          w.*,
          l.name AS lang_name,
          l.flag_emoji AS lang_flag
        FROM words w
        LEFT JOIN languages l ON w.language_code = l.code
        ORDER BY w.search_count DESC, w.updated_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all<any>();

    return (results || []).map(mapRowToWordEntry);
  } catch (err) {
    console.error('Error fetching popular words:', err);
    return [];
  }
}

export async function getRecentWords(db: D1Database, limit: number = 8): Promise<WordEntry[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare(`
        SELECT 
          w.*,
          l.name AS lang_name,
          l.flag_emoji AS lang_flag
        FROM words w
        LEFT JOIN languages l ON w.language_code = l.code
        ORDER BY w.created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all<any>();

    return (results || []).map(mapRowToWordEntry);
  } catch (err) {
    console.error('Error fetching recent words:', err);
    return [];
  }
}

export async function getRandomWords(db: D1Database, limit: number = 8): Promise<WordEntry[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare(`
        SELECT 
          w.*,
          l.name AS lang_name,
          l.flag_emoji AS lang_flag
        FROM words w
        LEFT JOIN languages l ON w.language_code = l.code
        ORDER BY RANDOM()
        LIMIT ?
      `)
      .bind(limit)
      .all<any>();

    return (results || []).map(mapRowToWordEntry);
  } catch (err) {
    console.error('Error fetching random suggestions from D1:', err);
    return [];
  }
}

export async function getAllLanguages(db: D1Database): Promise<Language[]> {
  if (!db) return [];
  try {
    const { results } = await db
      .prepare('SELECT code, name, native_name, flag_emoji FROM languages ORDER BY name ASC')
      .all<any>();

    return results || [];
  } catch (err) {
    console.error('Error fetching languages from D1:', err);
    return [];
  }
}
