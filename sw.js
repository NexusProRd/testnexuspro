// sw.js - NEXUS ELITE V5.0
const CACHE_NAME = 'nexus-cache-v5';
const STATIC_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './config.js',
    './manifest.json',
    './css/styles.css',
    './css/admin-styles.css',
    './js/nexus-core.js',
    './js/shop.js',
    './js/admin.js'
];

const IMAGE_CACHE = 'nexus-images-v1';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== IMAGE_CACHE)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Cache imágenes
    if (request.destination === 'image') {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(cache =>
                cache.match(request).then(cached =>
                    cached || fetch(request).then(response => {
                        cache.put(request, response.clone());
                        return response;
                    })
                )
            )
        );
        return;
    }

    // Para peticiones API, solo red
    if (url.hostname.includes('script.google.com')) {
        event.respondWith(fetch(request));
        return;
    }

    // Para otros assets, cache first
    event.respondWith(
        caches.match(request).then(cached =>
            cached || fetch(request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            })
        )
    );
});

// Notificaciones push
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
            vibrate: [200, 100, 200]
        });
    }
});