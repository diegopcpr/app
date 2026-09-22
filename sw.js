const CACHE_NAME = "carteirada-shell-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon192.png",
  "./icon512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// credenciais.json precisa sempre tentar a rede primeiro (pra novos acessos
// aparecerem na hora); o resto do app usa cache primeiro, pra abrir rápido e offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.url.includes("credenciais.json")) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((resp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
