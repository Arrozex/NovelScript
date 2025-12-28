
const CACHE_NAME = 'draftbook-v2';
// Only cache static assets that we know are safe. 
// We rely on the network for application logic to ensure we get the compiled/transpiled version from the server.
const urlsToCache = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Gloria+Hallelujah&family=Nunito:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Network First Strategy
  // Tries to get the fresh version from network. If it fails (offline), tries cache.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we get a valid response, clone it and update cache (optional, but good for offline eventually)
        // For this dev environment, we just return the network response to ensure latest code.
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
