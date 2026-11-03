/* Service worker: mở app nhanh và dùng được khi mất mạng. */
var CACHE = 'sotap-v1';
var SHELL = ['./', 'index.html', 'profiles.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'vendor/firebase-app-compat.js', 'vendor/firebase-firestore-compat.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  var same = u.origin === self.location.origin, font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!same && !font) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && (res.ok || res.type === 'opaque')) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); }); }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var h = (e.notification.data && e.notification.data.hash) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ('focus' in cs[i]) { cs[i].navigate && cs[i].navigate(self.registration.scope + h); return cs[i].focus(); } }
    return self.clients.openWindow(self.registration.scope + h);
  }));
});
