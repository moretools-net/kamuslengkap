import { FC } from 'hono/jsx';
import { WordEntry } from '../types';
import { Layout } from './layout';

interface HomeProps {
  popularWords: WordEntry[];
  recentWords: WordEntry[];
}

export const HomePage: FC<HomeProps> = ({ popularWords = [], recentWords = [] }) => {
  const suggestions = [
    { term: 'FOMO', desc: 'Slang Modern' },
    { term: 'Sumeh', desc: 'Bahasa Jawa' },
    { term: 'Resiliensi', desc: 'Psikologi' },
    { term: 'Santuy', desc: 'Gaul Indonesia' },
    { term: 'Ikigai', desc: 'Filosofi Jepang' },
    { term: 'Gaslighting', desc: 'Istilah Populer' },
    { term: 'Hygge', desc: 'Konsep Denmark' },
    { term: 'Silih Asah', desc: 'Falsafah Sunda' },
  ];

  return (
    <Layout
      title="Kamus Lengkap Semua Bahasa Online - Cari Makna Kata & Istilah Dunia"
      description="Cari dan pahami arti kata, istilah teknis, slang, idiom, dan ungkapan dari seluruh bahasa daerah dan dunia di KamusLengkap.com."
      currentPath="/"
    >
      {/* Hero Section */}
      <section class="text-center py-6 sm:py-12 max-w-3xl mx-auto">
        {/* Top Tagline with tiny red accent pulse dot */}
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue-light border border-brand-blue-border text-brand-blue-deep text-xs font-semibold mb-5">
          <span class="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
          <span>Kamus Lengkap Semua Bahasa • Akses Cepat di Seluruh Dunia</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-extrabold text-brand-black tracking-tight leading-tight mb-4">
          Pahami Makna Kata & Istilah <span class="text-brand-blue-dark">Bahasa Apa Saja</span>
        </h1>
        
        <p class="text-stone-600 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
          Tanyakan kata, frasa, ungkapan gaul, istilah keilmuan, hingga bahasa daerah dan bahasa asing. Temukan definisi akurat beserta contoh kalimatnya.
        </p>

        {/* Search Bar Form (Primary Blue Button) */}
        <form
          action="/makna"
          method="get"
          onsubmit="event.preventDefault(); const q = document.getElementById('search-input').value.trim(); if(q) { window.location.href = '/makna/' + encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-')); }"
          class="relative max-w-2xl mx-auto mb-6 shadow-lg shadow-brand-blue/10 rounded-2xl"
        >
          <div class="relative flex items-center">
            <div class="absolute left-4 text-stone-400 pointer-events-none">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search-input"
              type="text"
              name="q"
              placeholder="Ketik kata atau istilah apa saja (contoh: fomo, sumeh, resiliensi)..."
              autocomplete="off"
              autofocus
              class="w-full pl-12 pr-28 sm:pr-32 py-4 bg-white border-2 border-stone-200 hover:border-brand-blue focus:border-brand-blue-dark focus:ring-4 focus:ring-brand-blue-light rounded-2xl text-brand-black placeholder-stone-400 text-sm sm:text-base outline-none transition"
            />
            <button
              type="submit"
              class="absolute right-2 px-4 sm:px-6 py-2.5 bg-brand-blue-dark hover:bg-brand-blue-deep text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
            >
              Cari Makna
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div class="flex flex-wrap items-center justify-center gap-2 text-xs text-stone-500">
          <span class="font-medium text-stone-400">Contoh pencarian:</span>
          {suggestions.map((item) => (
            <a
              href={`/makna/${item.term.toLowerCase().replace(/\s+/g, '-')}`}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:border-brand-blue hover:text-brand-blue-dark hover:bg-brand-blue-light/50 rounded-lg text-stone-700 font-medium transition shadow-2xs"
            >
              <span>{item.term}</span>
              <span class="text-[10px] text-stone-400">({item.desc})</span>
            </a>
          ))}
        </div>
      </section>

      {/* Feature / Category Cards */}
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-10">
        <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs hover:border-brand-blue transition">
          <div class="w-9 h-9 rounded-lg bg-brand-blue-light text-brand-blue-dark flex items-center justify-center mb-3 border border-brand-blue-border">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-sm font-bold text-brand-black mb-1">Bahasa Daerah Nusantara</h2>
          <p class="text-xs text-stone-500 leading-relaxed">
            Kamus Jawa, Sunda, Minang, Bugis, Bali, Aceh, Batak, Madura, dan ratusan bahasa daerah lainnya di Indonesia.
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs hover:border-brand-blue transition">
          <div class="w-9 h-9 rounded-lg bg-brand-blue-light text-brand-blue-dark flex items-center justify-center mb-3 border border-brand-blue-border">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h2 class="text-sm font-bold text-brand-black mb-1">Slang & Istilah Gaul</h2>
          <p class="text-xs text-stone-500 leading-relaxed">
            Penjelasan istilah viral media sosial, akronim modern, slang Gen Z, hingga bahasa prokem netizen.
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs hover:border-brand-blue transition">
          <div class="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 class="text-sm font-bold text-brand-black mb-1">Istilah Keilmuan & Teknis</h2>
          <p class="text-xs text-stone-500 leading-relaxed">
            Definisi istilah kedokteran, biologi, hukum, teknologi IT, keuangan, ekonomi, dan dunia sains.
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs hover:border-brand-blue transition">
          <div class="w-9 h-9 rounded-lg bg-brand-blue-tint text-brand-blue-deep flex items-center justify-center mb-3 border border-brand-blue-border">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 class="text-sm font-bold text-brand-black mb-1">Bahasa Asing Dunia</h2>
          <p class="text-xs text-stone-500 leading-relaxed">
            Inggris, Jepang, Arab, Jerman, Prancis, Spanyol, Korea, Mandarin dengan pelafalan fonetik dan contoh kalimat.
          </p>
        </div>
      </section>

      {/* Popular Words Section */}
      <section class="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 my-8 shadow-2xs">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
          <div>
            <h3 class="text-base font-bold text-brand-black">Kata &amp; Istilah yang Sering Dicari</h3>
            <p class="text-xs text-stone-500">Pencarian populer dari pengguna KamusLengkap</p>
          </div>
          <a href="/kamus" class="text-xs font-semibold text-brand-blue-dark hover:text-brand-blue-deep transition flex items-center gap-1">
            Lihat Kamus Klasik
            <span>&rarr;</span>
          </a>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(popularWords.length > 0 ? popularWords : suggestions).map((w: any) => {
            const term = w.term || w;
            const slug = w.slug || term.toLowerCase().replace(/\s+/g, '-');
            const primaryTag = w.tags?.[0] || w.category || w.desc || 'Istilah';
            const flag = w.language_flag || '';
            return (
              <a
                href={`/makna/${slug}`}
                class="group p-3 rounded-lg border border-stone-100 hover:border-brand-blue hover:bg-brand-blue-light/40 transition flex flex-col justify-between"
              >
                <div class="font-semibold text-sm text-stone-800 group-hover:text-brand-blue-dark transition truncate">
                  {term}
                </div>
                <div class="text-[11px] text-stone-400 truncate mt-1 flex items-center gap-1">
                  {flag && <span class="text-xs">{flag}</span>}
                  <span>{primaryTag}</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Integration Banner to Legacy Dictionaries (Black card with subtle red accent pill) */}
      <section class="bg-brand-black text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-stone-800">
        <div>
          {/* Subtle Red Accent Pill */}
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-red text-white mb-2">
            Database Klasik
          </span>
          <h3 class="text-lg sm:text-xl font-bold mb-1">
            Mencari Kamus Pasangan Bahasa Tertentu?
          </h3>
          <p class="text-stone-300 text-xs sm:text-sm max-w-xl">
            Akses ribuan entri kamus terjemahan langsung seperti Jawa-Indonesia, Bugis-Indonesia, Sunda-Indonesia, hingga istilah per bidang di arsip klasik kami.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <a
            href="/kamus"
            class="px-4 py-2.5 bg-brand-blue text-brand-blue-deep hover:bg-white rounded-xl font-semibold text-xs sm:text-sm transition shadow-xs"
          >
            Kamus Bahasa
          </a>
          <a
            href="/istilah"
            class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-xs sm:text-sm transition shadow-xs"
          >
            Kamus Istilah
          </a>
        </div>
      </section>
    </Layout>
  );
};
