import { Context } from 'hono';
import { Env } from '../types';

export async function proxyToOrigin(c: Context<{ Bindings: Env }>): Promise<Response> {
  const originBase = c.env.ORIGIN_VPS_HOST || 'https://kamuslengkap.com';
  const url = new URL(c.req.url);
  const targetUrl = new URL(url.pathname + url.search, originBase);

  // Headers aman yang diteruskan ke VPS origin
  const forwardHeaders = new Headers();
  const allowedHeaders = [
    'accept',
    'accept-language',
    'accept-encoding',
    'user-agent',
    'cookie',
    'content-type',
    'authorization',
    'referer',
  ];

  for (const [key, value] of c.req.raw.headers.entries()) {
    if (allowedHeaders.includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  // Jika tidak ada user-agent, berikan default
  if (!forwardHeaders.has('user-agent')) {
    forwardHeaders.set('user-agent', 'KamusLengkap-Edge-Proxy/1.0');
  }

  // IP asli pengunjung dari Cloudflare
  const clientIp = c.req.header('cf-connecting-ip');
  if (clientIp) {
    forwardHeaders.set('x-forwarded-for', clientIp);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  const init: RequestInit = {
    method: c.req.method,
    headers: forwardHeaders,
    redirect: 'manual',
    signal: controller.signal,
  };

  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = c.req.raw.body;
  }

  try {
    const originResponse = await fetch(targetUrl.toString(), init);
    clearTimeout(timeoutId);

    const responseHeaders = new Headers(originResponse.headers);
    // Hapus content-encoding agar body stream tidak corrupt jika didekompresi otomatis
    responseHeaders.delete('content-encoding');

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`Gagal proxy ke origin ${targetUrl.toString()}:`, error);

    return c.html(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Server Sedang Sibuk - KamusLengkap.com</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body class="bg-slate-50 text-slate-800 p-8 flex items-center justify-center min-h-screen">
        <div class="max-w-md bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
          <h2 class="text-lg font-bold text-slate-900 mb-2">Halaman Sedang Diproses</h2>
          <p class="text-sm text-slate-500 mb-4">
            Server asal sedang memproses permintaan ini. Silakan muat ulang (refresh) halaman atau coba kembali sesaat lagi.
          </p>
          <a href="/" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
            Ke Halaman Utama
          </a>
        </div>
      </body>
      </html>`,
      504
    );
  }
}
