import type { BunextConfig } from "@moduletrace/bunext/types";
import { SiteData } from "./src/data/site-data";

/** Pages under these prefixes are served with `noindex, nofollow` */
export const NoIndexPathPrefixes = ["/admin"];

/** Paths crawlers are told to skip in `robots.txt` */
export const RobotsDisallowPaths = [
    "/admin",
    "/api",
    "/media",
    "/ws",
    "/webhooks",
];

const config: BunextConfig = {
    public_envs: {
        NEXT_PUBLIC_TINYMCE_BASE_URL: "/public/tinymce",
    },
    sitemap: {
        origin: SiteData["SiteURL"],
        exclude: NoIndexPathPrefixes.map((prefix) => `${prefix}/*`),
        // Production keeps the page date record on the /data volume so it
        // survives container rebuilds; unset locally, so .bunext/ is used.
        lastmod_file: process.env.PAGE_LASTMOD_FILE,
    },
    robots: {
        origin: SiteData["SiteURL"],
        rules: [
            { user_agent: "*", allow: ["/"], disallow: RobotsDisallowPaths },
        ],
        sitemaps: ["/sitemap.xml"],
    },
};

export default config;
