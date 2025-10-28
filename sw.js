// Nombre y versión del caché
const CACHE_NAME = "inventario-bovinos-v2";
const urlsToCache = [
  "/inventario-Bovinos/",
  "/inventario-Bovinos/index.html",
  "/inventario-Bovinos/manifest.json",
  "/inventario-Bovinos/sw.js",
  // agrega aquí tus iconos, imágenes, CSS o JS extra si tienes
];

// === INSTALACIÓN ===
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando nueva versión...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Archivos en caché");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // fuerza que el nuevo SW se active de inmediato
});

// === ACTIVACIÓN ===
self.addEventListener("activate", (event) => {
  console.log("[SW] Activado");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((oldCache) => {
            console.log("[SW] Borrando caché antigua:", oldCache);
            return caches.delete(oldCache);
          })
      );
    })
  );
  return self.clients.claim();
});

// === FETCH ===
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna del caché o va a la red si no está guardado
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          // Guarda nuevas peticiones en caché dinámico
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    })
  );
});

// === ACTUALIZACIÓN MANUAL DESDE index.html ===
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
