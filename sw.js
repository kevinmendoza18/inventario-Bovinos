// Nombre de la caché (aumenta la versión si haces cambios grandes)
const CACHE_NAME = 'inventario-bovinos-v3';

const urlsToCache = [
  '/inventario-Bovinos/',
  '/inventario-Bovinos/index.html',
  '/inventario-Bovinos/assets/css/style.css',
  '/inventario-Bovinos/js/main.js',
  '/inventario-Bovinos/manifest.json',
  '/inventario-Bovinos/assets/img/icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// ✅ INSTALACIÓN: cachea todos los archivos y se activa de inmediato
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Archivos cacheados correctamente');
      return cache.addAll(urlsToCache);
    })
  );

  // 👇 fuerza que este SW se active sin esperar al anterior
  self.skipWaiting();
});

// ✅ ACTIVACIÓN: limpia caches antiguos y toma control inmediato
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado.');
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      await clients.claim(); // 👈 fuerza control sobre las páginas abiertas
      console.log('Caches antiguas eliminadas.');
    })()
  );
});

// ✅ FETCH: primero busca en caché, luego en red, y actualiza el caché
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Devuelve el recurso del caché
        return response;
      }

      // Busca en red y guarda una copia en caché
      return fetch(event.request)
        .then((fetchedResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchedResponse.clone());
            return fetchedResponse;
          });
        })
        .catch(() => {
          // Si falla (sin red y sin caché), muestra el index.html básico
          if (event.request.mode === 'navigate') {
            return caches.match('/inventario-Bovinos/index.html');
          }
        });
    })
  );
});
