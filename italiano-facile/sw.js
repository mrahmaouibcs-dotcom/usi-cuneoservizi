/* ============================================================================
   sw.js — Service Worker di "Italiano Facile"
   Strategia: cache-first per i file statici (offline completo dopo il 1° avvio).
   Le risorse da CDN (React, font) vengono memorizzate runtime al primo fetch.
   ========================================================================== */

const CACHE_NAME = "italiano-facile-v2";

// Pre-cache all'installazione. Path relativi → funziona anche in sottocartella (GitHub Pages).
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./data.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

// --- Install: pre-cache dei file statici ---
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll fallisce se UN file manca: usiamo richieste tolleranti.
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => null)
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// --- Activate: pulizia delle cache vecchie ---
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// --- Fetch: cache-first, con fallback di rete e caching runtime ---
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          // Memorizza in cache le risposte valide (incluse quelle "opaque" da CDN).
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // Offline e non in cache: per le navigazioni, mostra la shell.
          if (req.mode === "navigate") return caches.match("./index.html");
          return caches.match("./") || Response.error();
        });
    })
  );
});
