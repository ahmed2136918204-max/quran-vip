const CACHE_VERSION = 'quran-vip-v2';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const OFFLINE_FALLBACK_URL = './offline.html';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  OFFLINE_FALLBACK_URL,
  './manifest.webmanifest',
  './Gemini_Generated_Image_umrraiumrraiumrr.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('./index.html', responseClone));
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(APP_SHELL_CACHE);
          const cachedPage = await cache.match(request);
          if (cachedPage) return cachedPage;

          const cachedIndex = await cache.match('./index.html');
          if (cachedIndex) return cachedIndex;

          return cache.match(OFFLINE_FALLBACK_URL);
        })
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
