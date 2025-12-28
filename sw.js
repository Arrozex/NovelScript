
// 簡易版 Service Worker
// 在這個開發環境中，我們不進行快取攔截，以免破壞即時編譯的機制。
// 這個檔案的存在僅為了滿足 PWA 的安裝條件。

self.addEventListener('install', (event) => {
  // 強制讓新的 SW 立即接管，取代舊的壞掉的 SW
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 立即控制所有頁面
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 不做任何快取，直接回傳網路請求
  // 這能解決 404 問題，因為我們讓伺服器來處理路由
  return; 
});
