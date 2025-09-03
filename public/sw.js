// public/sw.js
const CACHE_NAME = 'cinexp-v1';
const APP_SHELL_URLS = [
    '/index.html',
    '/app.js',
    '/styles/globals.css',
    '/manifest.json',
    '/icons/icon-192x192.png'
    // Add other core files here
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
