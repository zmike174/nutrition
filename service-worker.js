const CACHE_VERSION = 'v1.0.7'; // Меняй это при каждом обновлении!
const CACHE_NAME = `nutrition-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
  // Пропускаем ожидание и сразу активируем новую версию
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт:', CACHE_VERSION);
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Удаляем все старые кэши
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Захватываем контроль над всеми открытыми страницами
      return self.clients.claim();
    })
  );
});

// Перехват запросов - стратегия Network First (сеть приоритетнее кэша)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Клонируем ответ, т.к. response можно использовать только раз
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Если сеть недоступна, берём из кэша
        return caches.match(event.request);
      })
  );
});
