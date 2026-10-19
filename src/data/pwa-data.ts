import { SiteData } from "./site-data";

/**
 * What makes the app installable, shared by the pages that advertise it,
 * the server that serves it and the script that generates it.
 */
export const PwaStartPath = "/admin/bots";
export const PwaScope = "/";
export const PwaManifestPath = "/manifest.webmanifest";
export const PwaServiceWorkerPath = "/sw.js";
export const PwaOfflinePath = "/offline.html";

export type PwaIcon = {
    src: string;
    sizes: string;
    type: string;
    purpose: "any" | "maskable";
};

/**
 * Generated from `public/logos/logo.svg` by `bun run gen:favicon`.
 */
export const PwaIcons: PwaIcon[] = [
    {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
    },
    {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
    },
    {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
    },
    {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
    },
];

export type PwaShortcut = {
    name: string;
    url: string;
    icons: { src: string; sizes: string; type: string }[];
};

export const PwaShortcuts: PwaShortcut[] = [
    {
        name: "Routines",
        url: "/admin/routines",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
    {
        name: "Help",
        url: "/admin/help",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    },
];

export const PwaIconPath = (name: `icon` | `maskable`, size: number) =>
    `/icons/${name}-${size}.png`;

/**
 * The app's install name: `SiteName` is lowercase, `PwaShortName` fits
 * under an icon.
 */
export const PwaManifestName = SiteData["SiteName"];
export const PwaShortName = SiteData["SiteName"];
