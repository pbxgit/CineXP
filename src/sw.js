// src/sw.js
const CACHE_NAME = 'cinexp-v2.0';
const APP_SHELL_FILES = [
  '/index.html',
  '/src/css/style.css',
  '/src/js/main.js',
  '/src/js/router.js',
  '/src/js/api.js',
  '/src/js/ui.js',
  '/src/js/storage.js',
  '/src/js/config.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
