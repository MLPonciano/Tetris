const CACHE_NAME = 'tetris-cache-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './tetris.js',
  './TETRIS.svg',
  './manifest.json',
  './tetris_theme.mp3',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
