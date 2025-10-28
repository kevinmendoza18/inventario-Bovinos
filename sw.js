const CACHE_NAME = 'inventario-bovinos-v2';
const urlsToCache = [
  '/inventario-Bovinos/',
  '/inventario-Bovinos/index.html',
  '/inventario-Bovinos/css/style.css',
  '/inventario-Bovinos/js/main.js',
  '/inventario-Bovinos/manifest.json',
  '/inventario-Bovinos/assets/img/icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// ✅ Instalación del SW: almacena todos los archivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Archivos cacheados correctamente');
      return cache.addAll(urlsToCache);
    })
  );
});

// ✅ Activación: elimina versiones viejas del caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// ✅ Intercepta peticiones y responde desde caché u online
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devuelve lo que haya en caché o lo busca online
      return (
        response ||
        fetch(event.request).then((fetchedResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchedResponse.clone());
            return fetchedResponse;
          });
        })
      );
    }).catch(() => {
      // Si no hay red ni caché, muestra un fallback básico
      if (event.request.mode === 'navigate') {
        return caches.match('/inventario-Bovinos/index.html');
      }
    })
  );
});
