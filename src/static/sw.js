// 룰룰 서비스 워커: 한 번 본 게임 페이지는 인터넷이 끊겨도 열리게 해요.
const VERSION = '__BUILD__';
const CACHE = 'rulerule-' + VERSION;
const FONTS = 'rulerule-fonts';
const CORE = [
  '/',
  '/offline.html',
  '/games/',
  '/data/games.json',
  '/manifest.webmanifest',
  '/assets/css/app.css?v=' + VERSION,
  '/assets/js/app.js?v=' + VERSION,
  '/assets/js/table.js?v=' + VERSION,
  '/assets/js/growth.js?v=' + VERSION,
  '/assets/js/social.js?v=' + VERSION,
  '/assets/img/favicon.svg',
  '/assets/img/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('rulerule-') && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('/offline.html')) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (/(^|\.)cdn\.jsdelivr\.net$|^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req, FONTS));
    return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/go/') || url.pathname.startsWith('/account')) return;
  if (req.mode === 'navigate' || url.pathname === '/data/games.json') {
    e.respondWith(networkFirst(req));
    return;
  }
  e.respondWith(cacheFirst(req, CACHE));
});
