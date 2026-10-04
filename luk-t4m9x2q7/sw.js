// Najpierw sieć (świeża wersja od razu), a bez internetu lub przy wolnym łączu wersja z pamięci podręcznej.
var CACHE = "luk-v1";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var sameOrigin = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(caches.open(CACHE).then(function (c) {
    if (!sameOrigin) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; });
      });
    }
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        c.match(e.request, { ignoreSearch: true }).then(function (hit) { if (hit && !done) { done = true; resolve(hit); } });
      }, 3000);
      fetch(e.request, { cache: "no-cache" }).then(function (r) {
        clearTimeout(timer);
        if (r && r.ok) c.put(e.request, r.clone());
        if (!done) { done = true; resolve(r); }
      }).catch(function () {
        clearTimeout(timer);
        c.match(e.request, { ignoreSearch: true }).then(function (hit) { if (!done) { done = true; resolve(hit || Response.error()); } });
      });
    });
  }));
});
