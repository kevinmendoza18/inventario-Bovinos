// 🐄 service-worker.js — Inventario Bovinos
const CACHE_NAME = "inventario-v5"; // 🔄 Cambia el número cuando hagas grandes actualizaciones
const urlsToCache = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./js/main.js",
  "./assets/img/icon.png",
  "./manifest.json"
];

// Instalar el service worker y guardar en caché los archivos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Archivos cacheados correctamente");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Fuerza la activación inmediata del nuevo SW
});

// Activar y eliminar versiones antiguas del caché
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("Eliminando caché antigua:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Control inmediato sobre todas las páginas
});

// Interceptar peticiones y responder desde caché o red
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    })
  );
});
