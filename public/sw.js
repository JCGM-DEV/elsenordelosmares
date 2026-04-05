const CACHE_NAME = 'elsenormares-v31';

const CORE_ASSETS = [
  './',
  './index.html',
  './src/main.js',
  './src/engine.js',
  './src/style.css',
  './src/data/story.json',
  './manifest.json'
];

const IMAGE_ASSETS = [
  './almirante_final_message.webp',
  './almirante_triumph.webp',
  './alvaro_hero.webp',
  './aposentos.webp',
  './astilleros.webp',
  './azores_batalla.webp',
  './barco.webp',
  './bodega_mapa.webp',
  './bodega_polvora.webp',
  './bodegas.webp',
  './calles.webp',
  './calles_soldados.webp',
  './camino.webp',
  './clean_parchment.webp',
  './consejo.webp',
  './consejo_oro.webp',
  './convento.webp',
  './convento_pergamino.webp',
  './despacho.webp',
  './despacho_notas.webp',
  './despacho_sello.webp',
  './don_alvaro.webp',
  './escalera.webp',
  './escalera_espia.webp',
  './escorial.webp',
  './espia.webp',
  './felipe.webp',
  './felipe_ii.webp',
  './iglesia.webp',
  './iglesia_cocodrilo.webp',
  './iglesia_tumbas.webp',
  './lisboa.webp',
  './lisboa_incendio.webp',
  './lisboa_mercaderes.webp',
  './madrid_obras.webp',
  './mapas.webp',
  './mazmorras.webp',
  './mensajero.webp',
  './palacio_viso_epic.webp',
  './patio.webp',
  './patio_observar.webp',
  './plaza.webp',
  './plaza_marineros.webp',
  './secretario.webp',
  './taberna.webp',
  './taberna_dados.webp',
  './taberna_provisiones.webp',
  './victoria_botin.webp',
  './escudo.svg',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache core assets immediately, images in background
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      // Cache images without blocking install
      cache.addAll(IMAGE_ASSETS).catch(() => {});
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for HTML
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and external audio (music streams)
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'cdn.pixabay.com') return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; })
        )
      )
    );
    return;
  }

  // Cache-first for images and static assets
  if (e.request.destination === 'image' || url.pathname.match(/\.(webp|png|svg|js|css|json|woff2?)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }

  // Network-first for HTML
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
