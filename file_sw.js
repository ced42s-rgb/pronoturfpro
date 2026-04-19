/* ══════════════════════════════════════════════════════════
   PRONOTURF PRO — Service Worker V11
   Stratégie : Cache-first pour assets statiques,
               Network-first pour les pages HTML
══════════════════════════════════════════════════════════ */

const CACHE_NAME   = 'pronoturf-v11';
const CACHE_STATIC = 'pronoturf-v11-static';

// Fichiers mis en cache au premier chargement
const PRECACHE = [
  '/',
  '/index.html',
  '/connexion.html',
  '/pronoturf_pro_v11.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ── Install : précache des assets critiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      console.log('[SW] Précache installé');
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== CACHE_STATIC)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch : Network-first pour HTML, Cache-first pour le reste
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et externes (Stripe, cdnjs…)
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Pages HTML → Network-first (toujours fraîches si online)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Autres assets → Cache-first avec fallback réseau
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_STATIC).then(c => c.put(request, clone));
        return res;
      });
    })
  );
});
