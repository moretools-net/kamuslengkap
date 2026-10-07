import { html } from 'hono/html';
import { FC, PropsWithChildren } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  description?: string;
  canonical?: string;
  jsonLd?: object;
  currentPath?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({
  children,
  title = 'Kamus Lengkap Semua Bahasa Online - KamusLengkap.com',
  description = 'Kamus lengkap semua bahasa online, memahami arti kata, ungkapan, slang, istilah teknis, dan bahasa dunia dengan penjelasan akurat dan kontekstual.',
  canonical = 'https://kamuslengkap.com',
  jsonLd,
  currentPath = '/',
}) => {
  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="KamusLengkap.com" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3108107609212063"
          crossorigin="anonymous"
        />

        {/* Google Analytics 4 (GA4) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-8T8L7MG7M3"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-8T8L7MG7M3');`,
          }}
        />

        {/* Compiled Local Tailwind CSS (No CDN) */}
        <link rel="stylesheet" href="/styles.css" />

        {/* Schema JSON-LD */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </head>
      <body class="bg-brand-bg text-brand-black antialiased min-h-screen flex flex-col font-sans">
        {/* Top Navbar */}
        <header class="google-anno-skip bg-white border-b border-stone-200 sticky top-0 z-50 shadow-2xs">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <a href="/" class="flex items-center shrink-0 hover:opacity-90 transition">
              <img
                src="/logo.png"
                alt="KamusLengkap.com"
                class="h-9 w-auto object-contain"
                width={200}
                height={49}
              />
            </a>

            {/* Navigation Links (Biru sebagai link primer) */}
            <nav class="hidden md:flex items-center gap-1 text-sm font-medium text-stone-600">
              <a
                href="/kamus"
                class="px-3 py-2 rounded-md hover:text-brand-blue-dark hover:bg-brand-blue-light transition"
              >
                Kamus
              </a>
              <a
                href="/istilah"
                class="px-3 py-2 rounded-md hover:text-brand-blue-dark hover:bg-brand-blue-light transition"
              >
                Istilah
              </a>
              <a
                href="/"
                class={`px-3 py-2 rounded-md transition ${currentPath === '/' || currentPath.startsWith('/makna')
                  ? 'text-brand-blue-deep bg-brand-blue-light font-semibold'
                  : 'hover:text-brand-blue-dark hover:bg-brand-blue-light'
                  }`}
              >
                Makna Kata
              </a>
              <a
                href="/daftar"
                class="px-3 py-2 rounded-md hover:text-brand-blue-dark hover:bg-brand-blue-light transition"
              >
                Daftar
              </a>
              <a
                href="https://penerjemah.kamuslengkap.com"
                target="_blank"
                rel="noopener"
                class="px-3 py-2 rounded-md hover:text-brand-blue-dark hover:bg-brand-blue-light transition"
              >
                Penerjemah
              </a>
              <a
                href="/p/tentang"
                class="px-3 py-2 rounded-md hover:text-brand-blue-dark hover:bg-brand-blue-light transition"
              >
                Tentang
              </a>
            </nav>

            {/* Mobile menu link */}
            <div class="flex items-center md:hidden">
              <a
                href="/"
                class="text-xs font-semibold px-3 py-1.5 bg-brand-blue-light text-brand-blue-dark rounded-md border border-brand-blue-border"
              >
                Cari Makna
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>

        {/* Footer */}
        <footer class="bg-white border-t border-stone-200 mt-auto text-stone-500 text-sm">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div class="md:col-span-2">
                <a href="/" class="inline-block mb-3 hover:opacity-90 transition">
                  <img
                    src="/logo.png"
                    alt="KamusLengkap.com"
                    class="h-7 sm:h-8 w-auto object-contain"
                    width={200}
                    height={49}
                  />
                </a>
                <p class="text-stone-500 text-xs leading-relaxed max-w-md">
                  Kamus lengkap semua bahasa online. Menyediakan terjemahan dan penjelasan makna kata, slang, idiom, istilah ilmiah, serta ragam bahasa daerah dan dunia dengan cepat dan akurat.
                </p>
              </div>
              <div>
                <h4 class="font-semibold text-brand-black text-xs uppercase tracking-wider mb-3">Layanan Kamus</h4>
                <ul class="space-y-2 text-xs">
                  <li><a href="/kamus" class="hover:text-brand-blue-dark transition">Kamus Bilingual</a></li>
                  <li><a href="/istilah" class="hover:text-brand-blue-dark transition">Kamus Istilah</a></li>
                  <li><a href="/" class="hover:text-brand-blue-dark transition font-medium text-brand-blue-dark">Makna Kata &amp; Ungkapan</a></li>
                  <li><a href="https://penerjemah.kamuslengkap.com" class="hover:text-brand-blue-dark transition">Penerjemah Kalimat</a></li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-brand-black text-xs uppercase tracking-wider mb-3">Informasi</h4>
                <ul class="space-y-2 text-xs">
                  <li><a href="/p/tentang" class="hover:text-brand-blue-dark transition">Tentang Kami</a></li>
                  <li><a href="/daftar" class="hover:text-brand-blue-dark transition">Daftar Kata</a></li>
                  <li><a href="/p/kontak" class="hover:text-brand-blue-dark transition">Hubungi Kami</a></li>
                  <li><a href="/p/privasi" class="hover:text-brand-blue-dark transition">Kebijakan Privasi</a></li>
                </ul>
              </div>
            </div>
            <div class="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-2">
              <p>&copy; {new Date().getFullYear()} KamusLengkap.com. Hak cipta dilindungi.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
};
