
// PWA Fix: Network Only Mode & Cache Cleaner
// 這個版本的 Service Worker 會強制清除所有舊快取，並只使用網路請求。
// 這能解決開發環境中安裝後 404 的問題。

const CACHE_NAME = 'draftbook-network-only-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 清除所有舊的 cache，不管名字是什麼，避免 404
          console.log('SW: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 完全不使用 Cache，直接請求網路
  // 這樣可以避免在此類 Web Container 環境中路徑錯誤
  event.respondWith(fetch(event.request));
});
