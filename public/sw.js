const CACHE_VERSION = "chika-hyakkei-shell-v1";
const CORE_URLS = ["/", "/en/", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/ranking-config.js") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) void caches.open(CACHE_VERSION).then(cache => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) void caches.open(CACHE_VERSION).then(cache => cache.put(request, response.clone()));
        return response;
      });
    }),
  );
});
