const APP_VERSION = "v0.1.1-offline-alpha";
const BUILD_DATE = "2026-07-01";
const CACHE_NAME = `tactical-board-${APP_VERSION}-${BUILD_DATE}`;
const SCOPE_URL = new URL(self.registration.scope);
const APP_SHELL_URL = new URL("./", SCOPE_URL).toString();
const INDEX_URL = new URL("./index.html", SCOPE_URL).toString();
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./m5-test-qr.png",
];

function resolveScopedUrl(path) {
  return new URL(path, SCOPE_URL).toString();
}

function isScopedSameOrigin(url) {
  return url.origin === SCOPE_URL.origin && url.href.startsWith(SCOPE_URL.href);
}

function collectBuildAssets(indexHtml) {
  const urls = new Set(CORE_ASSETS.map(resolveScopedUrl));
  const assetPattern = /(?:href|src)="([^"]+)"/g;
  let match = assetPattern.exec(indexHtml);

  while (match) {
    const assetPath = match[1];
    if (!assetPath.startsWith("http") && !assetPath.startsWith("data:") && !assetPath.startsWith("#")) {
      const assetUrl = new URL(assetPath, SCOPE_URL);
      if (isScopedSameOrigin(assetUrl)) {
        urls.add(assetUrl.toString());
      }
    }

    match = assetPattern.exec(indexHtml);
  }

  return Array.from(urls);
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const shellResponse = await fetch(APP_SHELL_URL, { cache: "reload" });
  if (!shellResponse.ok) {
    throw new Error("App shell cache failed");
  }

  const shellHtml = await shellResponse.clone().text();
  await cache.put(APP_SHELL_URL, shellResponse.clone());
  await cache.put(INDEX_URL, shellResponse.clone());

  const assetUrls = collectBuildAssets(shellHtml).filter(
    (url) => url !== APP_SHELL_URL && url !== INDEX_URL,
  );

  await Promise.allSettled(
    assetUrls.map(async (url) => {
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) {
        await cache.put(url, response);
      }
    }),
  );
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith("tactical-board-") && cacheName !== CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName)),
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(APP_SHELL_URL, response.clone());
    }
    return response;
  } catch {
    const cachedShell = await cache.match(APP_SHELL_URL);
    if (cachedShell) {
      return cachedShell;
    }

    const cachedIndex = await cache.match(INDEX_URL);
    if (cachedIndex) {
      return cachedIndex;
    }

    return new Response(
      "<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><title>战术动画板离线</title><body><h1>战术动画板离线缓存未准备好</h1><p>请先在有网络时打开一次公网实验版，等待缓存完成后再离线使用。</p></body></html>",
      {
        headers: {
          "content-type": "text/html;charset=utf-8",
        },
      },
    );
  }
}

async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (!isScopedSameOrigin(requestUrl)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleStaticAsset(request));
});

