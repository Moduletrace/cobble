import { PwaBuildInfoPath } from "@/src/data/pwa-data";
import grabPrecacheManifest from "./grab-precache-manifest";

/**
 * Serves the running build (`.bunext/build-info.json`'s id) with every
 * file in `.bunext/public`, for the loading page to download before the
 * app runs. Never cached: a deploy must show at once. Not found in
 * development, which is never precached.
 */
export default function handleBuildInfo({
    pathname,
}: {
    pathname: string;
}): Response | null {
    if (pathname != PwaBuildInfoPath) return null;

    const manifest = grabPrecacheManifest();

    if (!manifest) return new Response("Not Found", { status: 404 });

    return Response.json(manifest, {
        headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
