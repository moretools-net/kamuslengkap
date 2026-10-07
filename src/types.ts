export interface Env {
  // Bindings
  DB: D1Database;
  ASSETS?: Fetcher;
  AI?: any;

  // Environment Variables
  ORIGIN_VPS_HOST?: string;
  AI_PROVIDER?: 'gemini' | 'deepseek' | 'cloudflare_gateway' | 'workers_ai';
  
  // Secrets / Keys
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
  
  // Cloudflare AI Gateway
  CF_ACCOUNT_ID?: string;
  CF_GATEWAY_ID?: string;

  // Cloudflare Workers AI
  WORKERS_AI_MODEL?: string;
}

export interface ExampleSentence {
  original: string;
  translation: string;
}

export interface Language {
  code: string;       // ISO 639-1: 'id', 'en', 'jv', dll.
  name: string;       // 'Bahasa Indonesia', 'Bahasa Inggris'
  native_name?: string;
  flag_emoji?: string;
}

export interface WordEntry {
  slug: string;
  term: string;
  language_code: string;       // FK ke languages.code ('id', 'en', 'jv', dll.)
  language_name: string;       // Dari tabel languages atau resolver: 'Bahasa Indonesia', 'Bahasa Inggris'
  language_flag?: string;      // Emoji bendera: '🇮🇩', '🇬🇧', dll.
  tags: string[];              // Sistem tag multi-value bersih tanpa garis miring: ['Slang Populer', 'Informal', 'Keuangan']
  category?: string;           // Fallback/backward compat (tag utama)
  formality?: string;          // Fallback/backward compat
  phonetic: string;            // Transkripsi IPA
  definition_short: string;
  definition_full: string;
  examples: ExampleSentence[];
  synonyms: string[];
  antonyms: string[];
  cultural_context: string;
  search_count?: number;
  provider_used?: string;
  created_at?: string;
  updated_at?: string;
}
