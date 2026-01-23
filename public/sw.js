const CACHE_NAME = 'personal-dashboard-v1';

// Install 이벤트
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate 이벤트
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  self.clients.claim();
});

// Fetch 이벤트: 네트워크 우선 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 네트워크 요청 시도
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공한 응답 반환 (캐싱 안 함 - Firestore 사용)
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 오프라인 메시지
        console.log('[Service Worker] Offline - request failed:', request.url);
        // 기본 오프라인 응답은 반환하지 않음
        // Firestore는 자체 오프라인 캐싱 지원
      })
  );
});
