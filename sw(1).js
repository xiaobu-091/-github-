const CACHE_NAME = 'photo-pwa-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-180.png', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 页面与脚本：网络优先（保证更新及时），离线时回退缓存
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || new Response('离线', { status: 503 })))
    );
    return;
  }
  // 图标等静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).catch(() => new Response('离线', { status: 503 }));
    })
  );
});
