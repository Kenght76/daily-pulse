// ============================================================
// Daily Pulse — Service Worker (Offline-First)
// Strategy: Cache first, network fallback
// ============================================================

const CACHE_NAME = 'daily-pulse-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/themes.css',
  './css/buttons.css',
  './css/animations.css',
  './js/store.js',
  './js/budget.js',
  './js/templates.js',
  './js/motivation.js',
  './js/quotes.js',
  './js/milestones.js',
  './js/themes.js',
  './js/chart.js',
  './js/reports.js',
  './js/reminders.js',
  './js/insights.js',
  './js/ui.js',
  './js/app.js',
  './config/defaults.json'
];

// Install — cache all core assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches, take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Removing old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — cache first, network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          // Return cached version, but also update cache in background
          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
              }
              return networkResponse;
            })
            .catch(() => {}); // Silently fail network update when offline

          return cached;
        }

        // Not in cache — try network, then cache for next time
        return fetch(request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline and not cached — return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('', { status: 503, statusText: 'Offline' });
          });
      })
  );
});
