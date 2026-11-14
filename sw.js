/* Tortue Blocs — service worker : fonctionnement hors ligne.
   Stratégie : on sert le cache tout de suite, et on le met à jour en arrière-plan
   (les mises à jour de l'appli arrivent donc au lancement suivant). */
var CACHE = 'tortue-blocs-v10';
var FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'css/agence.css', 'css/logique.css', 'css/usine.css',
  'js/turtle.js', 'js/blocks.js', 'js/levels.js', 'js/app.js', 'js/labyrinthe.js', 'js/agence.js', 'js/logique.js', 'js/usine-engine.js', 'js/usine-levels.js', 'js/usine.js', 'js/main.js',
  'vendor/blockly_compressed.js', 'vendor/blocks_compressed.js', 'vendor/javascript_compressed.js', 'vendor/msg/fr.js',
  'vendor/media/sprites.png', 'vendor/media/sprites.svg', 'vendor/media/1x1.gif', 'vendor/media/dropdown-arrow.svg',
  'vendor/media/handopen.cur', 'vendor/media/handclosed.cur', 'vendor/media/handdelete.cur',
  'vendor/media/pilcrow.png', 'vendor/media/quote0.png', 'vendor/media/quote1.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
