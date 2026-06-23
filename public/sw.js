const CACHE_NAME = 'human-driving-v1';

self.addEventListener('install', (event) => {
  // 즉시 활성화 (waiting 상태 건너뜀)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 이전 캐시 정리 후 즉시 클라이언트 제어 획득
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first 전략: 네트워크 우선, 실패 시 캐시 사용
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
