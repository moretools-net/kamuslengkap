export interface LanguageMeta {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGE_METAS: Record<string, LanguageMeta> = {
  id: { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  en: { code: 'en', name: 'Bahasa Inggris', flag: '🇬🇧' },
  jv: { code: 'jv', name: 'Bahasa Jawa', flag: '🇮🇩' },
  su: { code: 'su', name: 'Bahasa Sunda', flag: '🇮🇩' },
  ms: { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  ar: { code: 'ar', name: 'Bahasa Arab', flag: '🇸🇦' },
  zh: { code: 'zh', name: 'Bahasa Mandarin', flag: '🇨🇳' },
  ja: { code: 'ja', name: 'Bahasa Jepang', flag: '🇯🇵' },
  ko: { code: 'ko', name: 'Bahasa Korea', flag: '🇰🇷' },
  nl: { code: 'nl', name: 'Bahasa Belanda', flag: '🇳🇱' },
  pt: { code: 'pt', name: 'Bahasa Portugis', flag: '🇵🇹' },
  fr: { code: 'fr', name: 'Bahasa Prancis', flag: '🇫🇷' },
  de: { code: 'de', name: 'Bahasa Jerman', flag: '🇩🇪' },
  es: { code: 'es', name: 'Bahasa Spanyol', flag: '🇪🇸' },
  hi: { code: 'hi', name: 'Bahasa Hindi', flag: '🇮🇳' },
  bug: { code: 'bug', name: 'Bahasa Bugis', flag: '🇮🇩' },
  min: { code: 'min', name: 'Bahasa Minang', flag: '🇮🇩' },
  mad: { code: 'mad', name: 'Bahasa Madura', flag: '🇮🇩' },
  ban: { code: 'ban', name: 'Bahasa Bali', flag: '🇮🇩' },
  la: { code: 'la', name: 'Bahasa Latin', flag: '🏛️' },
  xx: { code: 'xx', name: 'Campuran / Global', flag: '🌐' },
};

export function resolveLanguageMeta(code?: string, fallbackName?: string): LanguageMeta {
  const c = (code || '').toLowerCase().trim();
  if (LANGUAGE_METAS[c]) return LANGUAGE_METAS[c];
  return {
    code: c || 'id',
    name: fallbackName || 'Bahasa Indonesia',
    flag: '🌐',
  };
}

export function resolveLanguageName(code?: string, fallback?: string): string {
  return resolveLanguageMeta(code, fallback).name;
}
