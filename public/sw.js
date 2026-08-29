const CACHE_NAME = "stentsync-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/register",
  "/ingest",
  "/technician-queue",
  "/statistics",
  "/whatsapp-center",
  "/icon.png",
  "/logo.png",
  "/manifest.json",
  "/favicon.ico",
];

// 1. Install event: Cache essential app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service Worker pre-caching warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate event: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Stale-While-Revalidate network-first strategy for dynamic clinical data
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip API calls and non-GET requests from service worker cache
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback for HTML page navigation while offline
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline in Operation Theatre", {
          status: 503,
          statusText: "Offline",
        });
      })
  );
});

// 4. Background Sync event (Android Background Sync API)
self.addEventListener("sync", (event) => {
  if (event.tag === "stentsync-offline-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_OFFLINE_SYNC" });
        });
      })
    );
  }
});
