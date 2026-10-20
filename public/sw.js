/**
 * Cobble's service worker.
 *
 * The app is server-rendered and private, so authenticated HTML is never
 * cached: navigating offline lands on the generated offline page instead
 * of a stale conversation or a cached login redirect. Only the shell
 * (icons, manifest, offline page) and versioned app assets are cached.
 *
 * Bump `CACHE_VERSION` when this file changes in a way that must drop the
 * old caches.
 */
const CACHE_VERSION = "cobble-v2";
const CACHE_NAME = `cobble-shell-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline.html";

const SHELL = [
    OFFLINE_URL,
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/maskable-192.png",
    "/icons/maskable-512.png",
    "/apple-touch-icon.png",
    "/favicon.ico",
    "/logos/logo.svg",
];

/**
 * Versioned app code and public assets: safe to refresh in the background.
 */
const ASSET_PREFIXES = ["/.bunext/", "/public/", "/icons/", "/logos/", "/brand/"];
const ASSET_PATHS = ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"];

/**
 * Never intercepted: live data, sockets, media bytes, proxied computers,
 * auth side effects, and the worker itself.
 */
const BYPASS_PREFIXES = ["/api/", "/ws", "/media", "/computers/"];
const BYPASS_PATHS = ["/sw.js", "/manifest.webmanifest", "/auth/logout"];

/**
 * Page scripts and styles bunext names after their content: one at such
 * a path never changes, so it is served from the cache without asking the
 * network again (`src/utils/is-hashed-asset-path.ts` has the same
 * pattern). Each deploy adds new names, so the oldest are dropped past
 * `MAX_HASHED_ASSETS`.
 */
const HASHED_ASSET = /^\/\.bunext\/public\/pages\/(?:.*\/)?(?:chunk-)?[A-Z0-9]{8}\.(?:js|css)$/;
const MAX_HASHED_ASSETS = 400;

const DEFAULT_ICON = "/icons/icon-192.png";
const DEFAULT_BADGE = "/icons/icon-192.png";

function isAssetRequest(url) {
    return (
        ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
        ASSET_PATHS.includes(url.pathname)
    );
}

function isBypassRequest(url) {
    return (
        BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
        BYPASS_PATHS.includes(url.pathname)
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(SHELL.map((url) => cache.add(url))),
        ),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;
    if (isBypassRequest(url)) return;

    /**
     * A navigation: network only. Anything private stays out of storage;
     * offline gets the shell's offline page.
     */
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const offline = await caches.match(OFFLINE_URL);
                return offline || new Response("You're offline.", { status: 503 });
            }),
        );
        return;
    }

    if (!isAssetRequest(url)) return;

    if (HASHED_ASSET.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(request);

            const network = fetch(request)
                .then((response) => {
                    if (response.ok && response.type === "basic") {
                        cache.put(request, response.clone()).catch(() => undefined);
                    }
                    return response;
                })
                .catch(() => undefined);

            return cached || (await network) || Response.error();
        }),
    );
});

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) return cached;

    const response = await fetch(request);

    if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone()).catch(() => undefined);
        trimHashedAssets(cache).catch(() => undefined);
    }

    return response;
}

/**
 * Cache keys come back in insertion order, so the first hashed ones are
 * the oldest.
 */
async function trimHashedAssets(cache) {
    const hashed = (await cache.keys()).filter((request) =>
        HASHED_ASSET.test(new URL(request.url).pathname),
    );

    await Promise.all(
        hashed
            .slice(0, Math.max(0, hashed.length - MAX_HASHED_ASSETS))
            .map((request) => cache.delete(request)),
    );
}

/**
 * The page asks for a new version from its update notice. Nothing skips
 * the wait until the user says so.
 */
self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("push", (event) => {
    let payload = {};

    try {
        payload = event.data ? event.data.json() : {};
    } catch (error) {
        payload = {};
    }

    const title = payload.title || "Cobble";
    const options = {
        body: payload.body || "",
        icon: payload.icon || DEFAULT_ICON,
        badge: payload.badge || DEFAULT_BADGE,
        tag: payload.tag || undefined,
        renotify: Boolean(payload.tag),
        requireInteraction: Boolean(payload.requireInteraction),
        data: {
            url: payload.url || "/admin/bots",
            ...(payload.data || {}),
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const target = new URL(
        event.notification.data?.url || "/admin/bots",
        self.location.origin,
    ).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(async (clients) => {
                for (const client of clients) {
                    if (client.url.startsWith(self.location.origin)) {
                        await client.focus();
                        if ("navigate" in client) {
                            await client.navigate(target).catch(() => undefined);
                        }
                        return;
                    }
                }

                await self.clients.openWindow(target);
            }),
    );
});

/**
 * The browser rotated the endpoint. The page holds the VAPID key and the
 * session, so it re-subscribes; this only tells it to.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                for (const client of clients) {
                    client.postMessage({
                        type: "PUSH_RESUBSCRIBE",
                        oldEndpoint: event.oldSubscription?.endpoint || null,
                    });
                }
            }),
    );
});
