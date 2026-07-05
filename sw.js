// HEGEMON service worker — makes the game installable and playable offline.
// Network-first so an online player always gets fresh code (the build changes
// often); falls back to the cached shell when offline.
const CACHE = "hegemon-v1";
const SHELL = [
  "/",
  "/game.html",
  "/game.css",
  "/game.js",
  "/web/engine.bundle.js",
  "/web/sprites.js",
  "/web/board3d.bundle.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Non-atomic: one missing asset must not fail the whole install.
      await Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return; // don't touch cross-origin
  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        const cached = await caches.match(req);
        return cached || (await caches.match("/game.html"));
      }
    })()
  );
});
