// 羊了个羊 - Service Worker
const CACHE_NAME = 'sheep-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json'
];

// 安装事件
self.addEventListener('install', event => {
  console.log('🔄 Service Worker 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ 缓存文件:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('🎉 Service Worker 安装完成');
        return self.skipWaiting();
      })
  );
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker 激活中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker 激活完成');
      return self.clients.claim();
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  // 跳过非GET请求
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 如果有缓存，返回缓存
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 否则从网络获取
        return fetch(event.request)
          .then(response => {
            // 只缓存成功的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应以缓存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 网络失败，返回离线页面
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            return new Response('游戏离线可用，请连接网络获取最新版本');
          });
      })
  );
});

// 接收消息（可用于更新等）
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
