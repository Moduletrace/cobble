import path from "path";
import { PwaManifestPath, PwaServiceWorkerPath } from "@/src/data/pwa-data";
import grabInstallName from "@/src/functions/backend/db/app-settings/grab-install-name";
import namePwaManifest from "@/src/utils/name-pwa-manifest";
import grabInstallIcon from "@/src/functions/backend/db/app-settings/grab-install-icon";
import iconPwaManifest from "@/src/utils/icon-pwa-manifest";
import installIconBase from "@/src/utils/install-icon-base";

const PUBLIC_DIR = path.resolve(import.meta.dir, "../../../../public");

const PwaFiles: Record<string, string> = {
    [PwaServiceWorkerPath]: "sw.js",
    [PwaManifestPath]: "manifest.webmanifest",
};

/**
 * Development serves a worker that takes itself out instead of `sw.js`.
 * A production deploy leaves a worker on the device that keeps serving
 * its build's code cache first, and development never precaches or
 * updates anything, so a page opened from the dev server would go on
 * running the old build. The page clears it too
 * (`clear-development-service-worker.ts`); this catches every other
 * registration path (Web Push, the loading page, an old background tab).
 */
const DevelopmentServiceWorker = `self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            await self.registration.unregister().catch(() => undefined);
            if ("caches" in self) {
                const keys = await caches.keys();
                await Promise.all(keys.map((key) => caches.delete(key)));
            }
            const clients = await self.clients.matchAll({ type: "window" });
            for (const client of clients) {
                if ("navigate" in client) await client.navigate(client.url).catch(() => undefined);
            }
        })(),
    );
});
`;

/**
 * Serves the service worker and the manifest with headers bunext's public
 * handler can't give them: neither may be cached by a browser or a CDN,
 * or a deploy waits an hour to reach installed apps. Only these two files
 * are special; every other public asset keeps its normal caching.
 */
export default async function handlePwaFile({
    pathname,
}: {
    pathname: string;
}): Promise<Response | null> {
    const file_name = PwaFiles[pathname];

    if (!file_name) return null;

    const development_stub =
        file_name == "sw.js" && process.env.NODE_ENV != "production"
            ? DevelopmentServiceWorker
            : null;

    const file = Bun.file(path.join(PUBLIC_DIR, file_name));

    if (!development_stub && !(await file.exists())) {
        return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers({
        "Content-Type":
            file_name.endsWith(".webmanifest")
                ? "application/manifest+json; charset=utf-8"
                : "text/javascript; charset=utf-8",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
    });

    if (file_name == "sw.js") {
        headers.set("Service-Worker-Allowed", "/");
    }

    const response = new Response(
        development_stub ||
            (file_name == "manifest.webmanifest" ? await namedManifest({ file }) : file),
        { headers },
    );

    /**
     * `Bun.file` adds a filename disposition; a manifest is inline data.
     */
    response.headers.delete("content-disposition");

    return response;
}

/**
 * The generated manifest under the install's own name and icon (Settings >
 * General). Stock, or when the file isn't JSON, it goes out as it is.
 */
async function namedManifest({ file }: { file: ReturnType<typeof Bun.file> }) {
    const text = await file.text();
    const install_name = await grabInstallName().catch(() => "");
    const icon_base = installIconBase({ icon: await grabInstallIcon().catch(() => null) });

    if (!install_name && !icon_base) return text;

    try {
        const named = namePwaManifest({ manifest: JSON.parse(text), install_name });

        return JSON.stringify(iconPwaManifest({ manifest: named, icon_base }), null, 4);
    } catch {
        return text;
    }
}
