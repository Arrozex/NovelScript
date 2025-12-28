
// ---------------------------------------------------------------------------
// SERVICE WORKER - RESET MODE
// ---------------------------------------------------------------------------
// 這個腳本的目的是為了「修復」PWA。
// 它會強制刪除所有快取，並強制瀏覽器每次都從網路讀取檔案。
// ---------------------------------------------------------------------------

const APP_VERSION = 'reset-v4-' + Date.now(); // 每次存檔都會變更，強迫更新

self.addEventListener('install', (event) => {
  // 1. 強制讓新的 SW 立即進入等待狀態，不等待舊的關閉
  console.log('[SW] Installing new version:', APP_VERSION);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 2. 啟動時，刪除所有快取 (Cache Storage)
  console.log('[SW] Activated. Cleaning up old caches...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // 3. 立即接管所有頁面
      console.log('[SW] Caches cleared. Claiming clients.');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // 4. 不做任何攔截。直接回傳 fetch(event.request)
  // 這確保了所有請求都直接去問伺服器，解決 404 問題。
  // 雖然這意味著離線無法使用，但能確保 APP 安裝後能打開。
  event.respondWith(fetch(event.request));
});
