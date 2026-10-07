import { Hono } from 'hono';
import { getAIProvider } from './services/ai';
import { slugify } from './services/ai/types';
import {
  getAllSlugs,
  getPopularWords,
  getRandomWords,
  getRecentWords,
  getWordBySlug,
  incrementSearchCount,
  saveWord,
} from './services/db';
import {
  getTargetSlugFromAlias,
  normalizeQueryToSlug,
  saveQueryAlias,
} from './services/normalizer';
import { proxyToOrigin } from './services/proxy';
import { Env } from './types';
import { HomePage } from './views/home';
import { Layout } from './views/layout';
import { MaknaPage } from './views/makna';

const app = new Hono<{ Bindings: Env }>();

// 1. Halaman Beranda (Modern Edge Homepage)
app.get('/', async (c) => {
  const [popularWords, recentWords, suggestionWords] = await Promise.all([
    getPopularWords(c.env.DB, 8).catch(() => []),
    getRecentWords(c.env.DB, 8).catch(() => []),
    getRandomWords(c.env.DB, 8).catch(() => []),
  ]);

  // Cache homepage selama 5 menit di browser, 15 menit di Cloudflare Edge CDN
  c.header('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600');

  return c.html(
    <HomePage
      popularWords={popularWords}
      recentWords={recentWords}
      suggestions={suggestionWords}
    />
  );
});

// 2. /makna query redirect (contoh: /makna?q=apa+arti+fomo -> /makna/fomo)
app.get('/makna', async (c) => {
  const rawQuery = c.req.query('q')?.trim();
  if (!rawQuery) return c.redirect('/');

  // A. Cek apakah ada di tabel alias D1
  const alias = await getTargetSlugFromAlias(c.env.DB, rawQuery);
  if (alias) {
    return c.redirect(`/makna/${alias}`);
  }

  // B. Normalisasi kata kunci (dengan aturan aman 1-kata)
  const normalizedSlug = normalizeQueryToSlug(rawQuery);
  if (normalizedSlug) {
    // Simpan ke alias jika query berbeda dengan slug target
    if (slugify(rawQuery) !== normalizedSlug) {
      c.executionCtx?.waitUntil(saveQueryAlias(c.env.DB, rawQuery, normalizedSlug));
    }
    return c.redirect(`/makna/${normalizedSlug}`);
  }

  return c.redirect('/');
});

// 3. Halaman Detail Makna Kata / Frasa / Istilah
app.get('/makna/:slug', async (c) => {
  const rawSlug = c.req.param('slug').toLowerCase().trim();
  if (!rawSlug) return c.redirect('/');

  // A. Normalisasi conversational query (contoh: /makna/apa-arti-fomo -> 301 ke /makna/fomo)
  // Aturan: Jika 1 kata ("arti", "makna", "pengertian"), TIDAK AKAN di-redirect!
  const rawText = rawSlug.replace(/-/g, ' ');
  const normalizedSlug = normalizeQueryToSlug(rawText);

  if (normalizedSlug && normalizedSlug !== rawSlug) {
    // Catat alias ke database di background
    c.executionCtx?.waitUntil(saveQueryAlias(c.env.DB, rawText, normalizedSlug));
    return c.redirect(`/makna/${normalizedSlug}`, 301);
  }

  const slug = normalizedSlug || rawSlug;

  // B. Cek Cache di Database D1 terlebih dahulu
  let entry = await getWordBySlug(c.env.DB, slug);

  if (entry && !entry.provider_used?.includes('demo')) {
    // Sudah ada di cache D1: Update counter pencarian di background
    c.executionCtx?.waitUntil(incrementSearchCount(c.env.DB, slug));
  } else {
    // C. Belum ada di cache: Panggil AI Engine yang aktif (Gemini / DeepSeek / CF Gateway / Workers AI)
    try {
      const rawTerm = slug.replace(/-/g, ' ');
      const provider = getAIProvider(c.env);
      entry = await provider.lookupWord(rawTerm);

      // Pastikan slug konsisten
      entry.slug = slug;

      // Simpan ke database D1 di background agar pencarian berikutnya instan
      c.executionCtx?.waitUntil(saveWord(c.env.DB, entry));
    } catch (err: any) {
      console.error(`Gagal mengurai kata "${slug}":`, err);

      return c.html(
        <Layout
          title={`Pencarian "${slug}" - KamusLengkap.com`}
          description="Terjadi kendala saat memproses kata ini."
        >
          <div class="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-stone-200 text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 class="text-xl font-bold text-brand-black mb-2">
              Tidak Dapat Memuat Kata "{slug.replace(/-/g, ' ')}"
            </h1>
            <p class="text-sm text-stone-600 mb-6 leading-relaxed">
              Layanan AI sedang sibuk atau konfigurasi API Key belum diset. Silakan coba kembali sesaat lagi.
            </p>
            <a
              href="/"
              class="inline-block px-5 py-2.5 bg-brand-blue-dark hover:bg-brand-blue-deep text-white rounded-xl text-sm font-semibold transition"
            >
              Kembali ke Beranda
            </a>
          </div>
        </Layout>,
        500
      );
    }
  }

  // Ambil kata terkait untuk sidebar
  const relatedWords = await getPopularWords(c.env.DB, 6).catch(() => []);

  // Cloudflare Edge Cache: Simpan halaman di CDN selama 24 jam (1 hari), browser 1 jam
  if (entry && !entry.provider_used?.includes('demo')) {
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    c.header('CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  } else {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  return c.html(<MaknaPage entry={entry} relatedWords={relatedWords} />);
});

// 4. REST API: Lookup Makna (dengan normalisasi otomatis)
app.get('/api/makna/:query', async (c) => {
  const query = c.req.param('query');
  const normalizedSlug = normalizeQueryToSlug(query.replace(/-/g, ' '));
  const slug = normalizedSlug || slugify(query);

  let entry = await getWordBySlug(c.env.DB, slug);
  if (!entry || entry.provider_used?.includes('demo')) {
    try {
      const provider = getAIProvider(c.env);
      entry = await provider.lookupWord(slug.replace(/-/g, ' '));
      entry.slug = slug;
      c.executionCtx?.waitUntil(saveWord(c.env.DB, entry));
    } catch (err: any) {
      c.header('Cache-Control', 'no-store, no-cache');
      return c.json({ success: false, error: err.message }, 500);
    }
  } else {
    c.executionCtx?.waitUntil(incrementSearchCount(c.env.DB, slug));
  }

  if (entry && !entry.provider_used?.includes('demo')) {
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    c.header('CDN-Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  }

  return c.json({ success: true, data: entry });
});

// 5. Sitemap XML — generate dinamis dari D1 + halaman statis
app.get('/sitemap.xml', async (c) => {
  const BASE_URL = 'https://kamuslengkap.com';
  const today = new Date().toISOString().split('T')[0];

  // Halaman statis dengan prioritas tinggi
  const staticUrls = [
    { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/kamus`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/istilah`, priority: '0.8', changefreq: 'weekly', lastmod: today },
  ];

  // Ambil semua slug dari D1
  const slugRows = await getAllSlugs(c.env.DB).catch(() => []);

  const dynamicUrls = slugRows.map(({ slug, updated_at }) => {
    const lastmod = updated_at
      ? updated_at.split('T')[0]
      : today;
    return `  <url>
    <loc>${BASE_URL}/makna/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  const staticXml = staticUrls
    .map(
      ({ loc, priority, changefreq, lastmod }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    staticXml,
    ...dynamicUrls,
    '</urlset>',
  ].join('\n');

  // Cache: browser 1 jam, edge 24 jam
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  return c.body(xml);
});

// 6. TRANSPARENT PROXY: Teruskan semua path lama & route lainnya ke VPS DigitalOcean
// Meliputi: /kamus/*, /arti/*, /istilah/*, /daftar/*, /p/*, /assets/*, dll.
app.all('*', async (c) => {
  return proxyToOrigin(c);
});

export default app;
