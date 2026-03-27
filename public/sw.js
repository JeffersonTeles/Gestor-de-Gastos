const CACHE_NAME = "gestor-gastos-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install event: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.filter((asset) => {
        // Only add SVG and manifest, skip PNG if not available
        return !asset.includes(".png") || asset.includes("192") || asset.includes("512");
      })).catch(() => {
        // Ignore errors for missing files (PNG might not exist yet)
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  // Claim clients immediately
  self.clients.claim();
});

// Fetch event: implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Network First for Supabase API requests
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First for static assets (CSS, JS, fonts, images)
  if (
    request.url.includes("/assets/") ||
    request.url.includes(".css") ||
    request.url.includes(".js") ||
    request.url.includes(".woff") ||
    request.url.includes(".woff2") ||
    request.url.includes(".ttf") ||
    request.url.includes("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // Return cached or offline fallback
            return caches.match(request);
          });
      })
    );
    return;
  }

  // Network First for HTML (including index.html for offline support)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache fallback
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return cached index.html as final fallback for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
