# KamusLengkap.com - Edge AI Lexicon

Aplikasi modern **Kamus Lengkap Semua Bahasa Berbasis AI** untuk **[KamusLengkap.com](https://kamuslengkap.com/)**, dibangun di atas **Cloudflare Workers Edge Architecture**, **Cloudflare D1 Database**, dan **Tailwind CSS**.

Aplikasi ini dirancang menggunakan pola **_Strangler Fig Pattern at the Edge_**:
* **Homepage (`/`)** dan **Fitur Makna Baru (`/makna/*`)** dilayani langsung di Cloudflare Edge dengan kecepatan ultra-tinggi (TTFB < 30ms).
* **Seluruh path lama** (`/kamus/*`, `/arti/*`, `/istilah/*`, `/daftar/*`, `/p/*`, dsb.) **tetap diteruskan secara transparan ke VPS DigitalOcean lama** tanpa mengganggu sistem yang sudah ada.

---

## 🚀 Fitur Utama

1. **Makna Kata & Istilah (`/makna/:slug`):**
   * Memahami kata/frasa dari bahasa apa saja (Bahasa Daerah: Jawa, Sunda, Minang, Bugis, Bali, dsb.; Bahasa Asing: Inggris, Jepang, Arab, dsb.; Istilah Keilmuan & Slang/Gaul modern).
   * Pelafalan Fonetik + **Audio Text-to-Speech (TTS)** bawaan browser tanpa biaya API.
   * Ringkasan makna, definisi mendalam, contoh kalimat bilingual, sinonim/antonim, dan konteks budaya/etimologi.
   * **SEO-Ready:** Dilengkapi schema markup `DefinedTerm` JSON-LD untuk Google Rich Snippets.

2. **Smart Caching di Cloudflare D1:**
   * Setiap kata baru yang di-generate AI langsung disimpan ke database D1 di Edge.
   * Pengguna berikutnya yang mencari kata yang sama akan mendapatkan respon instan (<30ms) dengan **biaya $0**.

3. **Multi-Engine AI Provider (Plug & Play):**
   * **Google Gemini** (Gemini 2.5 Flash / 2.0 Flash)
   * **DeepSeek** (DeepSeek V3 / R1)
   * **Cloudflare AI Gateway** (universal proxy, caching, fallback otomatis)
   * **Cloudflare Workers AI** (model bawaan Cloudflare seperti Llama 3.3)
   * **Demo Mode** bawaan jika API Key belum dipasang.

4. **Desain & Gaya Tampilan Konsisten:**
   * Dibangun menggunakan **Tailwind CSS lokal (terkompilasi, tanpa CDN)**.
   * Warna utama (`#2563eb`), layout, navbar, dan tipografi selaras dengan identitas KamusLengkap yang sudah ada.

---

## 📁 Struktur Direktori

```
kamuslengkap/
├── src/
│   ├── index.tsx                  # Router utama Hono & Edge reverse proxy
│   ├── types.ts                   # Tipe TypeScript & Interface
│   ├── services/
│   │   ├── ai/                    # Multi-Engine AI Provider
│   │   │   ├── index.ts           # Factory selector AI provider
│   │   │   ├── prompts.ts         # System prompt leksikografi
│   │   │   ├── gemini.ts          # Google Gemini 2.0/2.5 Flash adapter
│   │   │   ├── deepseek.ts        # DeepSeek API adapter
│   │   │   ├── cloudflare-gateway.ts # Cloudflare AI Gateway adapter
│   │   │   └── workers-ai.ts      # Cloudflare Workers AI adapter
│   │   ├── db.ts                  # Query & operasi Cloudflare D1
│   │   └── proxy.ts               # Reverse proxy transparan ke VPS DigitalOcean
│   ├── views/
│   │   ├── layout.tsx             # Layout navbar & footer
│   │   ├── home.tsx               # Homepage pencarian cepat
│   │   └── makna.tsx              # Halaman detail definisi kata
│   └── styles/
│       └── input.css              # Source Tailwind CSS v4
├── public/
│   └── styles.css                 # File CSS hasil compile (teroptimasi, 25KB)
├── schema.sql                     # Skema tabel database D1
├── seed.sql                       # Contoh data awal (fomo, sumeh, resiliensi, dll.)
├── wrangler.toml                  # Konfigurasi Cloudflare Workers & D1
├── .dev.vars.example              # Contoh konfigurasi API Key
└── package.json
```

---

## 🛠️ Cara Menjalankan Secara Lokal

### 1. Inisialisasi Database D1 Lokal
```bash
npm run d1:init
npx wrangler d1 execute kamuslengkap-db --local --file=./seed.sql
```

### 2. Atur Environment Variables
Salin `.dev.vars.example` menjadi `.dev.vars`:
```bash
cp .dev.vars.example .dev.vars
```
Isi konfigurasi API key yang ingin Anda gunakan:
```ini
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
ORIGIN_VPS_HOST=https://kamuslengkap.com
```

### 3. Build CSS & Jalankan Development Server
```bash
npm run dev
```
Akses di browser Anda: `http://localhost:8787`

---

## 🌐 Cara Deploy ke Cloudflare Production

### 1. Buat Database D1 di Cloudflare
Jalankan di terminal:
```bash
npx wrangler d1 create kamuslengkap-db
```
Salin `database_id` yang dihasilkan ke dalam file `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "kamuslengkap-db"
database_id = "ISI_DENGAN_DATABASE_ID_DARI_CLOUDFLARE"
```

### 2. Eksekusi Skema Database di Cloudflare Remote
```bash
npm run d1:init:remote
```

### 3. Set Secret API Key di Cloudflare
```bash
npx wrangler secret put GEMINI_API_KEY
# atau jika memakai DeepSeek:
npx wrangler secret put DEEPSEEK_API_KEY
```

### 4. Deploy Aplikasi
```bash
npm run deploy
```

---

## 🔀 Pengaturan DNS & Routing di Cloudflare

Agar domain `kamuslengkap.com` menggunakan Worker ini:
1. Buka dashboard Cloudflare untuk zona `kamuslengkap.com`.
2. Masuk ke menu **Workers Routes** (atau tambahkan Custom Domain langsung di Worker).
3. Tambahkan Route: `kamuslengkap.com/*` mengarah ke Worker `kamuslengkap`.
4. Pastikan di `wrangler.toml` nilai `ORIGIN_VPS_HOST` mengarah ke IP atau hostname asal VPS DigitalOcean Anda (misal: `https://origin-vps.kamuslengkap.com` atau IP VPS langsung).
