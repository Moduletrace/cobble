import path from "path";
import { AppData } from "@/src/data/app-data";
import { PwaLoadingNamePlaceholder, PwaLoadingPath } from "@/src/data/pwa-data";
import grabInstallName from "@/src/functions/backend/db/app-settings/grab-install-name";
import installDisplayName from "@/src/utils/install-display-name";
import escapeHtml from "@/src/utils/escape-html";
import { getCookie } from "@/src/utils/cookies";
import needsPrecachePage from "@/src/utils/needs-precache-page";
import grabPrecacheManifest from "./grab-precache-manifest";

const LOADING_PAGE = path.join(
    path.resolve(import.meta.dir, "../../../../public"),
    PwaLoadingPath,
);

/**
 * The placeholder `public/loading.html` carries for the running build.
 */
const BuildPlaceholder = "{{build}}";

/**
 * Production only: a browser opening a page without the running build in
 * its cookie gets the loading page in its place, at the same address. The
 * page downloads the build's `.bunext/public` files into the build's
 * cache, checks they are all there, sets the cookie and reloads, and the
 * service worker then serves the app's code from the device. Null lets
 * the request through.
 */
export default async function handlePrecacheGate({
    req,
    url,
}: {
    req: Request;
    url: URL;
}): Promise<Response | null> {
    const manifest = grabPrecacheManifest();

    const needs_page = needsPrecachePage({
        method: req.method,
        pathname: url.pathname,
        fetch_mode: req.headers.get("Sec-Fetch-Mode"),
        fetch_dest: req.headers.get("Sec-Fetch-Dest"),
        accept: req.headers.get("Accept"),
        cookie_build_id: getCookie(req, AppData["BuildCookieName"]),
        build_id: manifest?.build_id,
    });

    if (!needs_page || !manifest) return null;

    const file = Bun.file(LOADING_PAGE);

    if (!(await file.exists())) return null;

    const build = JSON.stringify({
        build_id: manifest.build_id,
        total: manifest.files.length,
    }).replace(/</g, "\\u003c");

    const name = escapeHtml({
        text: installDisplayName({ install_name: await grabInstallName().catch(() => "") }),
    });

    const page = (await file.text())
        .replace(BuildPlaceholder, build)
        .replace(PwaLoadingNamePlaceholder, name);

    return new Response(page, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
