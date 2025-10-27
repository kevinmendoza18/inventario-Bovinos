self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open('inventario-bovinos').then(function(cache) {
        return cache.addAll([
            '/inventario-Bovinos/',
            '/inventario-Bovinos/index.html',
            '/inventario-Bovinos/manifest.json',
            '/inventario-Bovinos/sw.js',
            // añade CSS, iconos, etc. con rutas absolutas aquí
          ]);
      })
    );
  });
  

  self.addEventListener('fetch', function(e) {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  });
  