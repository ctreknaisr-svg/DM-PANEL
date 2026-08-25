// VERSION — cambia este número cada vez que actualices el panel
const VERSION = '20260824';
const CACHE = 'dm-panel-' + VERSION;

// Archivos a cachear para modo offline
const ASSETS = ['/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// INSTALL — pre-cachea assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — borra cachés viejos automáticamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Borrando caché viejo:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH — network first, caché como fallback offline
self.addEventListener('fetch', e => {
  // Solo intercepta peticiones del mismo origen
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Si la red funciona, guarda en caché y devuelve la respuesta fresca
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red — sirve desde caché
        return caches.match(e.request)
          .then(cached => cached || caches.match('/index.html'));
      })
  );
});

// MENSAJE desde la página para forzar actualización
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
