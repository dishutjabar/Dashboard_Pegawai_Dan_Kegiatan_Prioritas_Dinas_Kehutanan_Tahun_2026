/* GeoHutan Service Worker v3 - Lebih aman, tidak intercept API call */
const CACHE_NAME = 'geohutan-v4';

const STATIC_URLS = [
  './index.html',
  './styles.css',
  './app-core.js',
  './app-features.js',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_URLS.map(url => cache.add(url).catch(e => console.warn('Skip cache:', url, e)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  const isGoogleDomain = url.hostname.includes('google') || url.hostname.includes('gstatic') || url.hostname.includes('googleapis') || url.hostname.includes('unpkg') || url.hostname.includes('leaflet') || url.hostname.includes('nominatim') || url.hostname.includes('openstreet');
  const isExternal = url.origin !== self.location.origin;

  if (event.request.method !== 'GET' || isGoogleDomain || isExternal) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

