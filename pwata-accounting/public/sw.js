const CACHE_NAME = "pwata-v1";
const STATIC_ASSETS = ["/", "/sales", "/expenses", "/invoices", "/customers", "/reports", "/login"];

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  (self as any).skipWaiting();
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k: string) => k !== CACHE_NAME).map((k: string) => caches.delete(k)))
    )
  );
  (self as any).clients.claim();
});

self.addEventListener("fetch", (event: any) => {
  const { request } = event;

  // API calls: network first, no cache
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { status: 503 }))
    );
    return;
  }

  // Pages: cache first, then network
  event.respondWith(
    caches.match(request).then((cached: any) => {
      return cached || fetch(request).then((response: any) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
