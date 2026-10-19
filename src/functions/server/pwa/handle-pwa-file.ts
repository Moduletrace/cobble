import path from "path";
import { PwaManifestPath, PwaServiceWorkerPath } from "@/src/data/pwa-data";

const PUBLIC_DIR = path.resolve(import.meta.dir, "../../../../public");

const PwaFiles: Record<string, string> = {
    [PwaServiceWorkerPath]: "sw.js",
    [PwaManifestPath]: "manifest.webmanifest",
};

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

    const file = Bun.file(path.join(PUBLIC_DIR, file_name));

    if (!(await file.exists())) {
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

    const response = new Response(file, { headers });

    /**
     * `Bun.file` adds a filename disposition; a manifest is inline data.
     */
    response.headers.delete("content-disposition");

    return response;
}
