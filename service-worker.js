/* GeoHutan Service Worker */

const CACHE_VERSION = 'geohutan-2026-v1.1.v1.0.v11';
const CACHE_NAME = `geohutan-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `geohutan-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './css/ai.css',
  './app-core.js',
  './app-features.js',
  './js/ai.js',
  './manifest.json',
  './img/pwa-icon-192.png',
  './img/pwa-icon-512.png'
];

const BYPASS_HOSTS = [
  'google.com',
  'googleapis.com',
  'gstatic.com',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'jsdelivr.net',
  'openstreetmap.org',
  'opentopomap.org',
  'arcgisonline.com',
  'script.google.com',
  'docs.google.com',
  'drive.google.com',
  'lh3.googleusercontent.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

function shouldBypass(req, url) {
  if (req.method !== 'GET') return true;
  if (!url.protocol.startsWith('http')) return true;
  if (url.origin !== self.location.origin) return true;
  if (BYPASS_HOSTS.some(host => url.hostname.includes(host))) return true;

  // Large spatial data should be fetched directly. Caching it in the service
  // worker can block startup and consume storage on low-end devices.
  return /\.(geojson|json)$/i.test(url.pathname) && !url.pathname.endsWith('/manifest.json');
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME && key !== CACHE_DYNAMIC)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (shouldBypass(req, url)) return;

  const path = url.pathname;
  const isHTML = path.endsWith('.html') || path === '/' || path.endsWith('/');
  const isCore = path.endsWith('.js') || path.endsWith('.css');

  if (isHTML) {
    event.respondWith(networkFirst(req));
  } else if (isCore) {
    event.respondWith(staleWhileRevalidate(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  try {
    const networkRes = await fetch(req);
    if (networkRes && networkRes.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return offlineResponse();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const update = fetch(req).then(networkRes => {
    if (networkRes && networkRes.status === 200) {
      cache.put(req, networkRes.clone());
    }
    return networkRes;
  }).catch(() => null);

  if (cached) return cached;
  return update.then(res => res || offlineResponse());
}

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
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response('Resource tidak tersedia offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
