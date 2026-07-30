/* ═══════════════════════════════════════════════════════════════
   GeoHutan Service Worker — Auto-Update Edition
   ⚡ Setiap kali file ini diubah, cache LAMA otomatis terhapus
   ⚡ Halaman langsung reload ke versi terbaru tanpa clear cache manual
   ═══════════════════════════════════════════════════════════════ */

// ── UBAH VERSI INI setiap kali deploy / update proyek ──────────
// Bisa pakai tanggal: 'geohutan-2026-07-30-v1'
// Atau auto timestamp jika build tool tersedia
const CACHE_VERSION = 'geohutan-2026-07-30-v1';
const CACHE_NAME    = `geohutan-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `geohutan-dynamic-${CACHE_VERSION}`;

// ── File statis yang di-pre-cache saat install ──────────────────
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app-core.js',
  './app-features.js',
  './manifest.json'
];

// ── Domain eksternal yang TIDAK boleh di-intercept ──────────────
const BYPASS_PATTERNS = [
  'google.com', 'googleapis.com', 'gstatic.com',
  'unpkg.com', 'cdnjs.cloudflare.com', 'jsdelivr.net',
  'openstreetmap.org', 'opentopomap.org', 'arcgisonline.com',
  'nominatim.openstreetmap.org', 'script.google.com',
  'docs.google.com', 'drive.google.com', 'lh3.googleusercontent.com',
  'fonts.googleapis.com', 'fonts.gstatic.com'
];

// ─────────────────────────────────────────────────────────────────
// INSTALL — Pre-cache file statis & langsung aktif (skipWaiting)
// ─────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll dengan fallback per-file agar tidak gagal total
      const results = await Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Skip cache (tidak kritis):', url, err.message)
          )
        )
      );
      const ok  = results.filter(r => r.status === 'fulfilled').length;
      const bad = results.filter(r => r.status === 'rejected').length;
      console.log(`[SW] Pre-cache selesai: ${ok} berhasil, ${bad} dilewati`);

      // ⚡ Langsung aktifkan SW baru tanpa menunggu tab ditutup
      await self.skipWaiting();
    })()
  );
});

// ─────────────────────────────────────────────────────────────────
// ACTIVATE — Hapus cache versi LAMA, ambil alih semua klien
// ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', CACHE_VERSION);

  event.waitUntil(
    (async () => {
      // Hapus semua cache yang bukan versi saat ini
      const allCacheKeys = await caches.keys();
      const oldCaches = allCacheKeys.filter(
        key => key !== CACHE_NAME && key !== CACHE_DYNAMIC
      );

      if (oldCaches.length > 0) {
        console.log('[SW] Menghapus cache lama:', oldCaches);
        await Promise.all(oldCaches.map(key => caches.delete(key)));
        console.log('[SW] Cache lama berhasil dihapus');
      }

      // Ambil alih semua tab yang terbuka sekarang juga
      await self.clients.claim();
      console.log('[SW] Aktif & mengontrol semua klien');

      // ⚡ Kirim sinyal ke semua tab untuk reload halaman
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: CACHE_VERSION
        });
        console.log('[SW] Sinyal update dikirim ke klien:', client.url);
      });
    })()
  );
});

// ─────────────────────────────────────────────────────────────────
// FETCH — Strategi caching cerdas
//   • File HTML utama  → Network-First (selalu cek update)
//   • File JS/CSS lokal → Stale-While-Revalidate (cepat + fresh)
//   • Request eksternal → Langsung bypass (tidak di-cache)
// ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya tangani GET
  if (req.method !== 'GET') return;

  // Bypass semua domain eksternal
  const isExternal = url.origin !== self.location.origin;
  const isBypass   = BYPASS_PATTERNS.some(p => url.hostname.includes(p));
  if (isExternal || isBypass) return;

  // Jangan cache chrome-extension atau non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // ── Strategi berdasarkan tipe file ──────────────────────────
  const path = url.pathname;
  const isHTML = path.endsWith('.html') || path === '/' || path.endsWith('/');
  const isCore = path.endsWith('app-core.js') || path.endsWith('app-features.js') || path.endsWith('styles.css');

  if (isHTML) {
    // HTML → Network-First: selalu ambil dari server, fallback ke cache
    event.respondWith(networkFirst(req));
  } else if (isCore) {
    // JS/CSS inti → Stale-While-Revalidate: tampil cepat dari cache,
    // di background ambil versi baru untuk request berikutnya
    event.respondWith(staleWhileRevalidate(req));
  } else {
    // Asset lain (gambar, font lokal, dll) → Cache-First
    event.respondWith(cacheFirst(req));
  }
});

// ─────────────────────────────────────────────────────────────────
// Strategi: Network-First
// ─────────────────────────────────────────────────────────────────
async function networkFirst(req) {
  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    console.warn('[SW] Network gagal, pakai cache:', req.url);
    const cached = await caches.match(req);
    if (cached) return cached;
    // Offline fallback untuk navigasi
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline – Tidak ada koneksi internet', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Strategi: Stale-While-Revalidate
// ─────────────────────────────────────────────────────────────────
async function staleWhileRevalidate(req) {
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  // Update di background
  const fetchPromise = fetch(req).then(networkRes => {
    if (networkRes && networkRes.status === 200) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  }).catch(() => null);

  // Kalau ada cache, tampilkan segera; kalau tidak, tunggu network
  return cached || fetchPromise;
}

// ─────────────────────────────────────────────────────────────────
// Strategi: Cache-First
// ─────────────────────────────────────────────────────────────────
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.status === 200) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    console.warn('[SW] Cache-first gagal:', req.url);
    return new Response('Resource tidak tersedia offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// Pesan dari client (misal: force skip waiting)
// ─────────────────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Menerima perintah SKIP_WAITING dari klien');
    self.skipWaiting();
  }
});
