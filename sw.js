const CACHE_NAME = 'elsenormares-v36';

const CORE_ASSETS = [
  './',
  './index.html',
  './src/main.js',
  './src/engine.js',
  './src/style.css',
  './data/story.json',
  './manifest.json'
];

const IMAGE_ASSETS = [
  './images/scenes/almirante_final_message.webp',
  './images/scenes/almirante_triumph.webp',
  './images/characters/alvaro_hero.webp',
  './images/scenes/aposentos.webp',
  './images/scenes/astilleros.webp',
  './images/scenes/azores_batalla.webp',
  './images/scenes/barco.webp',
  './images/scenes/bodega_mapa.webp',
  './images/scenes/bodega_polvora.webp',
  './images/scenes/bodegas.webp',
  './images/scenes/calles.webp',
  './images/scenes/calles_soldados.webp',
  './images/scenes/camino.webp',
  './images/interface/clean_parchment.webp',
  './images/scenes/consejo.webp',
  './images/scenes/consejo_oro.webp',
  './images/scenes/convento.webp',
  './images/scenes/convento_pergamino.webp',
  './images/scenes/despacho.webp',
  './images/scenes/despacho_notas.webp',
  './images/scenes/despacho_sello.webp',
  './images/characters/don_alvaro.webp',
  './images/scenes/escalera.webp',
  './images/scenes/escalera_espia.webp',
  './images/scenes/escorial.webp',
  './images/characters/espia.webp',
  './images/characters/felipe.webp',
  './images/characters/felipe_ii.webp',
  './images/scenes/iglesia.webp',
  './images/scenes/iglesia_cocodrilo.webp',
  './images/scenes/iglesia_tumbas.webp',
  './images/scenes/lisboa.webp',
  './images/scenes/lisboa_incendio.webp',
  './images/scenes/lisboa_mercaderes.webp',
  './images/scenes/madrid_obras.webp',
  './images/scenes/mapas.webp',
  './images/scenes/mazmorras.webp',
  './images/characters/mensajero.webp',
  './images/scenes/palacio_viso_epic.webp',
  './images/scenes/patio.webp',
  './images/scenes/patio_observar.webp',
  './images/scenes/plaza.webp',
  './images/scenes/plaza_marineros.webp',
  './images/characters/secretario.webp',
  './images/scenes/taberna.webp',
  './images/scenes/taberna_dados.webp',
  './images/scenes/taberna_provisiones.webp',
  './images/scenes/victoria_botin.webp',
  './images/interface/escudo.svg',
  './images/interface/favicon.svg',
  './images/interface/icon-192.png',
  './images/interface/icon-512.png'
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
