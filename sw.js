/* ════════════════════════════════════════════════════════════════
   COYOTE · sw.js — Service Worker
   NETWORK-FIRST strategy: always tries network, falls back to cache
   if offline. Critical for an actively developed app — you'll always
   get fresh code on every reload, but the app still works offline.
   ════════════════════════════════════════════════════════════════ */

'use strict';

// Bump this when you want every installed PWA to reset its cache.
const CACHE_VERSION = 'coyote-v7';

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// On install — pre-cache the shell, then become active immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();  // Don't wait for old workers to die
});

// On activate — delete old caches AND claim all open tabs immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())  // Take control of open pages
    );
});

// On fetch — NETWORK-FIRST so users always get the latest code.
// Falls back to cache only when offline.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(req).then(resp => {
            // Update the cache with this fresh response
            if (resp && resp.status === 200) {
                const clone = resp.clone();
                caches.open(CACHE_VERSION).then(c => c.put(req, clone));
            }
            return resp;
        }).catch(() => {
            // Offline — fall back to whatever's cached
            return caches.match(req).then(cached => cached || caches.match('./index.html'));
        })
    );
});
