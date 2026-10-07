import { FC } from 'hono/jsx';
import { WordEntry } from '../types';
import { Layout } from './layout';

interface MaknaProps {
  entry: WordEntry;
  relatedWords?: WordEntry[];
}

export const MaknaPage: FC<MaknaProps> = ({ entry, relatedWords = [] }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.definition_short,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'KamusLengkap.com',
      url: 'https://kamuslengkap.com',
    },
    termCode: entry.slug,
  };

  const canonicalUrl = `https://kamuslengkap.com/makna/${entry.slug}`;

  return (
    <Layout
      title={`Arti Kata & Makna "${entry.term}" - KamusLengkap.com`}
      description={`Apa arti "${entry.term}"? Simak definisi lengkap, pelafalan, contoh kalimat, dan konteks penggunaannya dalam ${entry.language_name}.`}
      canonical={canonicalUrl}
      jsonLd={jsonLd}
      currentPath={`/makna/${entry.slug}`}
    >
      {/* Breadcrumb Navigation (Links in Blue) */}
      <nav class="flex items-center gap-2 text-xs text-stone-500 mb-6">
        <a href="/" class="hover:text-brand-blue-dark transition">Beranda</a>
        <span>/</span>
        <span class="text-stone-400">Makna Kata</span>
        <span>/</span>
        <span class="text-brand-black font-semibold">{entry.term}</span>
      </nav>

      {/* Main Grid: Content + Sidebar */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Main Content (2 Cols) */}
        <div class="lg:col-span-2 space-y-6">
          {/* Main Dictionary Entry Card */}
          <article class="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            {/* Header / Term Title */}
            <div class="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-3xl sm:text-4xl font-extrabold text-brand-black tracking-tight">
                    {entry.term}
                  </h1>

                  {/* Audio Pronunciation Button (Web Speech API in Blue) */}
                  <button
                    type="button"
                    title={`Dengarkan pelafalan ${entry.term}`}
                    onclick={`(function(){
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        var u = new SpeechSynthesisUtterance('${entry.term.replace(/'/g, "\\'")}');
                        u.lang = '${entry.language_code || 'id'}';
                        window.speechSynthesis.speak(u);
                      } else {
                        alert('Browser Anda belum mendukung pemutaran suara Web Speech.');
                      }
                    })()`}
                    class="p-2 text-brand-blue-deep hover:text-white hover:bg-brand-blue-dark border border-brand-blue-border rounded-full transition cursor-pointer shadow-2xs"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>

                {entry.phonetic && (
                  <div class="text-stone-500 font-mono text-sm mt-1">
                    {entry.phonetic}
                  </div>
                )}
              </div>

              {/* Tags / Badges: Language Pill + Multi-Value Tag Chips (No Slashes!) */}
              <div class="flex flex-wrap items-center gap-1.5">
                {/* Language Pill with Flag Emoji */}
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue-light text-brand-blue-deep border border-brand-blue-border">
                  {entry.language_flag && <span>{entry.language_flag}</span>}
                  <span>{entry.language_name}</span>
                </span>

                {/* Multi-value Clean Tags */}
                {entry.tags && entry.tags.map((tag) => (
                  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Definition (Callout Box in Primary Soft Blue) */}
            <div class="my-6 p-4 rounded-xl bg-brand-blue-light border-l-4 border-l-brand-blue-dark border border-brand-blue-border/70 text-brand-black">
              <div class="text-xs font-bold uppercase tracking-wider text-brand-blue-deep mb-1.5 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-brand-blue-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ringkasan Makna
              </div>
              <p class="text-base sm:text-lg font-medium text-brand-black leading-snug">
                {entry.definition_short}
              </p>
            </div>

            {/* Full Detailed Definition */}
            {entry.definition_full && (
              <div class="my-6">
                <h2 class="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Penjelasan &amp; Konteks Penggunaan
                </h2>
                <div class="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3">
                  {entry.definition_full}
                </div>
              </div>
            )}

            {/* Example Sentences */}
            {entry.examples && entry.examples.length > 0 && (
              <div class="my-8 pt-6 border-t border-stone-100">
                <h2 class="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-brand-blue-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Contoh Penggunaan dalam Kalimat
                </h2>
                <div class="space-y-3">
                  {entry.examples.map((ex) => (
                    <div class="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-sm">
                      <div class="font-semibold text-brand-black italic mb-1">
                        &ldquo;{ex.original}&rdquo;
                      </div>
                      <div class="text-stone-600 text-xs sm:text-sm">
                        <span class="text-brand-blue-dark font-bold mr-1">&rarr;</span>
                        {ex.translation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cultural Context / Etymology */}
            {entry.cultural_context && (
              <div class="my-6 pt-6 border-t border-stone-100">
                <h2 class="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Asal-usul &amp; Konteks Budaya
                </h2>
                <p class="text-stone-700 text-sm leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  {entry.cultural_context}
                </p>
              </div>
            )}

            {/* Synonyms (Blue) & Antonyms (Red Accent) */}
            {(entry.synonyms?.length > 0 || entry.antonyms?.length > 0) && (
              <div class="my-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-6">
                {entry.synonyms && entry.synonyms.length > 0 && (
                  <div class="flex-1">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                      Sinonim &amp; Kata Terkait
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      {entry.synonyms.map((syn) => (
                        <a
                          href={`/makna/${syn.toLowerCase().trim().replace(/\s+/g, '-')}`}
                          class="px-2.5 py-1 bg-stone-100 hover:bg-brand-blue-light hover:text-brand-blue-dark text-stone-700 rounded-md text-xs font-medium transition border border-stone-200 hover:border-brand-blue"
                        >
                          {syn}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {entry.antonyms && entry.antonyms.length > 0 && (
                  <div class="flex-1">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                      Lawan Kata (Antonim)
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      {entry.antonyms.map((ant) => (
                        <a
                          href={`/makna/${ant.toLowerCase().trim().replace(/\s+/g, '-')}`}
                          class="px-2.5 py-1 bg-stone-100 hover:bg-brand-red-light hover:text-brand-red text-stone-700 rounded-md text-xs font-medium transition border border-stone-200 hover:border-brand-red/40"
                        >
                          {ant}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>

          {/* Inline Search for another word */}
          <div class="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
            <h3 class="text-sm font-bold text-brand-black mb-3">
              Cari Kata atau Istilah Lainnya
            </h3>
            <form
              action="/makna"
              method="get"
              onsubmit="event.preventDefault(); const q = document.getElementById('inner-search-input').value.trim(); if(q) { window.location.href = '/makna/' + encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-')); }"
              class="flex gap-2"
            >
              <input
                id="inner-search-input"
                type="text"
                placeholder="Ketik kata yang ingin dicari..."
                class="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl text-sm focus:border-brand-blue-dark focus:ring-2 focus:ring-brand-blue-light outline-none"
              />
              <button
                type="submit"
                class="px-5 py-2.5 bg-brand-blue-dark hover:bg-brand-blue-deep text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Cari
              </button>
            </form>
          </div>
        </div>

        {/* Right / Sidebar (1 Col) */}
        <aside class="space-y-6">
          {/* Quick Info Box */}
          <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
            <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4 pb-2 border-b border-stone-100">
              Informasi Leksikal
            </h3>
            <dl class="space-y-3.5 text-xs">
              <div class="flex items-center justify-between">
                <dt class="text-stone-500">Bahasa Asal</dt>
                <dd class="font-semibold text-brand-black flex items-center gap-1.5">
                  {entry.language_flag && <span>{entry.language_flag}</span>}
                  <span>{entry.language_name}</span>
                </dd>
              </div>

              <div>
                <dt class="text-stone-500 mb-1.5">Tag & Klasifikasi</dt>
                <dd class="flex flex-wrap gap-1">
                  {entry.tags && entry.tags.length > 0 ? (
                    entry.tags.map((tag) => (
                      <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span class="text-stone-400">-</span>
                  )}
                </dd>
              </div>

              {entry.search_count !== undefined && (
                <div class="flex justify-between pt-2 border-t border-stone-100">
                  <dt class="text-stone-500">Dilihat</dt>
                  <dd class="font-semibold text-brand-black">{entry.search_count} kali</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Related / Other Words */}
          {relatedWords && relatedWords.length > 0 && (
            <div class="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 pb-2 border-b border-stone-100">
                Pencarian Lainnya
              </h3>
              <ul class="space-y-2 text-xs">
                {relatedWords.map((rw) => (
                  <li>
                    <a
                      href={`/makna/${rw.slug}`}
                      class="flex items-center justify-between p-2 rounded-lg hover:bg-brand-blue-light hover:text-brand-blue-dark transition text-stone-700 font-medium"
                    >
                      <span class="truncate">{rw.term}</span>
                      <span class="text-[10px] text-stone-400 shrink-0 ml-2 flex items-center gap-1">
                        {rw.language_flag && <span>{rw.language_flag}</span>}
                        <span>{rw.language_name}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Link to Classic Kamus */}
          <div class="bg-stone-100/70 rounded-2xl border border-stone-200 p-5 text-xs text-stone-600">
            <h4 class="font-bold text-brand-black mb-1">Butuh Terjemahan Bahasa Daerah?</h4>
            <p class="leading-relaxed mb-3">
              KamusLengkap memiliki ribuan koleksi kosakata kamus Jawa-Indonesia, Sunda-Indonesia, Bugis-Indonesia, dll.
            </p>
            <a
              href="/kamus"
              class="inline-block font-semibold text-brand-blue-dark hover:text-brand-blue-deep"
            >
              Kunjungi Direktori Kamus &rarr;
            </a>
          </div>
        </aside>
      </div>
    </Layout>
  );
};
