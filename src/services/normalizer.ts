/**
 * Normalisasi query pencarian cerdas.
 *
 * ATURAN PENTING:
 * 1. Jika query HANYA 1 KATA (misal: "arti", "makna", "pengertian", "definisi", "fomo"),
 *    JANGAN PERNAH di-strip! Kata tersebut adalah entri kamus yang sah.
 * 2. Jika query terdiri dari LEBIH DARI 1 KATA dan mengandung pola pertanyaan percakapan
 *    (misal: "apa arti fomo", "fomo itu apa", "jelaskan definisi fomo"),
 *    maka pola pertanyaan di-strip sehingga menghasilkan kata inti ("fomo").
 */

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

export function normalizeQuery(rawQuery: string): string {
  if (!rawQuery) return '';

  let cleaned = rawQuery.toLowerCase().trim();

  // Bersihkan tanda baca di sekelilingnya: ?, !, ., ", ', tanda kurung
  cleaned = cleaned.replace(/^[?"'.,()\[\]\s]+|[?"'.,()\[\]\s]+$/g, '').trim();

  // Pecah berdasarkan spasi untuk menghitung jumlah kata
  const words = cleaned.split(/\s+/).filter(Boolean);

  // ATURAN 1: Jika hanya 1 kata, jangan di-strip sama sekali!
  if (words.length <= 1) {
    return cleaned;
  }

  // ATURAN 2: Jika lebih dari 1 kata, periksa dan bersihkan pola pertanyaan percakapan
  let result = cleaned;

  // A. Pola Awalan Pertanyaan (Prefixes)
  const prefixes = [
    // "apa arti dari kata", "apa makna dari", "apa maksud dari", "apa itu"
    /^apa\s+(itu\s+yang\s+dimaksud\s+dengan|itu|arti(nya)?|makna(nya)?|maksud(nya)?|definisi(nya)?)\s+(dari\s+kata|dari)?\s*/i,
    // "apakah arti", "apakah yang dimaksud dengan"
    /^apakah\s+(yang\s+dimaksud\s+dengan|arti|makna|maksud|definisi)\s+(dari\s+kata|dari)?\s*/i,
    // "jelaskan definisi", "jelaskan arti", "jelaskan makna", "tolong jelaskan"
    /^(tolong\s+)?jelaskan\s+(arti|makna|maksud|definisi|pengertian)\s+(dari\s+kata|dari)?\s*/i,
    // "pengertian dari", "definisi dari", "makna dari"
    /^(pengertian|definisi|makna|maksud)\s+dari\s+(kata\s+)?/i,
    // "arti kata", "makna kata"
    /^(arti|makna)\s+kata\s+/i,
    // "mengenal istilah", "tentang istilah"
    /^(mengenal|tentang)\s+(istilah\s+)?/i,
    // "arti ...", "makna ..." (hanya jika diikuti oleh kata lain, misal "arti fomo" -> "fomo")
    /^(arti|makna|definisi|pengertian)\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(result)) {
      const candidate = result.replace(prefix, '').trim();
      // Pastikan hasil setelah strip tidak menjadi kosong
      if (candidate.length > 0) {
        result = candidate;
        break;
      }
    }
  }

  // B. Pola Akhiran Pertanyaan (Suffixes)
  const suffixes = [
    // "... itu apa ya", "... itu apa sih", "... itu apa"
    /\s+(itu\s+apa|artinya\s+apa|maknanya\s+apa|maksudnya\s+apa)(\s+(ya|sih|dong|kan))?\??$/i,
    // "... adalah apa", "... artinya apa"
    /\s+adalah\s+(apa|seperti\s+apa)\??$/i,
    // "... artinya?", "... maknanya?" (hanya jika ada kata sebelumnya)
    /\s+(artinya|maknanya|maksudnya)\??$/i,
    // partikel penegas di akhir: "dong", "sih", "ya"
    /\s+(dong|sih|ya|kan)\??$/i,
  ];

  for (const suffix of suffixes) {
    if (suffix.test(result)) {
      const candidate = result.replace(suffix, '').trim();
      // Pastikan hasil setelah strip tidak menjadi kosong
      if (candidate.length > 0) {
        result = candidate;
        break;
      }
    }
  }

  // C. Jika setelah di-strip hasilnya valid, kembalikan. Jika kosong, fallback ke query awal.
  return result.trim() || cleaned;
}

/**
 * Normalisasi query dan ubah menjadi URL slug yang aman.
 */
export function normalizeQueryToSlug(rawQuery: string): string {
  const normalized = normalizeQuery(rawQuery);
  return slugify(normalized);
}

/**
 * Mencari pemetaan alias di database D1 (Tabel query_aliases).
 */
export async function getTargetSlugFromAlias(db: D1Database, rawQuery: string): Promise<string | null> {
  if (!db || !rawQuery.trim()) return null;
  const cleaned = rawQuery.toLowerCase().trim();
  try {
    const row = await db
      .prepare('SELECT target_slug FROM query_aliases WHERE raw_query = ? LIMIT 1')
      .bind(cleaned)
      .first<{ target_slug: string }>();

    if (row?.target_slug) {
      // Tingkatkan hit count di background
      await db
        .prepare('UPDATE query_aliases SET hit_count = hit_count + 1 WHERE raw_query = ?')
        .bind(cleaned)
        .run()
        .catch(() => {});
      return row.target_slug;
    }
    return null;
  } catch (err) {
    console.error('Error querying query_aliases table:', err);
    return null;
  }
}

/**
 * Menyimpan pemetaan alias ke tabel query_aliases.
 */
export async function saveQueryAlias(db: D1Database, rawQuery: string, targetSlug: string): Promise<void> {
  if (!db || !rawQuery.trim() || !targetSlug.trim()) return;
  const cleaned = rawQuery.toLowerCase().trim();
  // Jangan simpan jika query sama persis dengan target
  if (slugify(cleaned) === targetSlug) return;

  try {
    await db
      .prepare(`
        INSERT INTO query_aliases (raw_query, target_slug, hit_count)
        VALUES (?, ?, 1)
        ON CONFLICT(raw_query) DO UPDATE SET
          target_slug = excluded.target_slug,
          hit_count = query_aliases.hit_count + 1
      `)
      .bind(cleaned, targetSlug)
      .run();
  } catch (err) {
    console.error('Error saving to query_aliases table:', err);
  }
}
