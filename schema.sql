-- Skema Cloudflare D1 Database untuk KamusLengkap AI

-- Tabel referensi bahasa (master data)
CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY,       -- ISO 639-1: 'id', 'en', 'jv', 'su', dll.
  name TEXT NOT NULL,          -- 'Bahasa Indonesia', 'Bahasa Inggris'
  native_name TEXT,            -- 'Indonesian', 'English', 'Javanese'
  flag_emoji TEXT              -- '🇮🇩', '🇬🇧', '🇸🇦'
);

-- Tabel utama entri kata / istilah
CREATE TABLE IF NOT EXISTS words (
  slug TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  language_code TEXT REFERENCES languages(code),  -- FK ke languages
  tags_json TEXT,              -- JSON Array tag multi-value: ["Slang Populer", "Informal", "Keuangan"]
  category TEXT,               -- Kategori utama
  formality TEXT,              -- Formalitas
  phonetic TEXT,               -- Pelafalan fonetik IPA
  definition_short TEXT NOT NULL,
  definition_full TEXT NOT NULL,
  examples_json TEXT,          -- JSON Array: [{"original": "...", "translation": "..."}]
  synonyms_json TEXT,          -- JSON Array: ["sinonim1", ...]
  antonyms_json TEXT,          -- JSON Array: ["antonim1", ...]
  cultural_context TEXT,
  search_count INTEGER DEFAULT 1,
  provider_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_words_search_count ON words (search_count DESC);
CREATE INDEX IF NOT EXISTS idx_words_language ON words (language_code);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words (created_at DESC);

-- Tabel pemetaan alias / normalisasi query pencarian
CREATE TABLE IF NOT EXISTS query_aliases (
  raw_query TEXT PRIMARY KEY,
  target_slug TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_query_aliases_target ON query_aliases (target_slug);
