// PRONOTURF PRO — Service Worker V9.8
// Stratégie : Network First → toujours la version la plus récente

const CACHE_NAME = 'pronoturf-v98';
const OFFLINE_URLS = ['/index.html', '/app.html'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS).catch(()=>{}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
  // Notifier tous les onglets qu'une mise à jour est disponible
  self.clients.matchAll({type:'window'}).then(clients => {
    clients.forEach(client => client.postMessage({type:'SW_UPDATED',version:CACHE_NAME}));
  });
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/.netlify/')) return;

  event.respondWith(
    // Network First : toujours essayer le réseau en premier
    fetch(event.request.clone())
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback hors-ligne uniquement
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (url.pathname.includes('app')) return caches.match('/app.html');
          return caches.match('/index.html');
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
