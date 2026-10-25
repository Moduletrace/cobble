import type { BotHue } from "@/src/dict/bot-dict";
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
/**
 * The page a browser gets instead of the app while it downloads a build
 * it hasn't yet (`handlePrecacheGate`), generated like the offline page.
 */
export const PwaLoadingPath = "/loading.html";

/**
 * The running build's id and files (`handle-build-info.ts`). Each build's
 * `.bunext/public` files are downloaded into their own cache,
 * `<prefix><build_id>`, which holds the marker once every file is in.
 * `public/sw.js` repeats all three.
 */
export const PwaBuildInfoPath = "/build-info.json";
export const PwaPrecacheCachePrefix = "cobble-assets-";
export const PwaPrecacheMarkerPath = "/__cobble-precached";

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

/**
 * A notification's `badge`: the stone's white silhouette, since Android
 * draws only its alpha. `public/sw.js` repeats the path.
 */
export const PwaBadgeSize = 96;
export const PwaBadgePath = `/icons/badge-${PwaBadgeSize}.png`;

/**
 * What `handlePrecacheGate` swaps for the install's name in the loading
 * page's title.
 */
export const PwaLoadingNamePlaceholder = "{{name}}";

/**
 * The install's own name (Settings > General), so two installs on one
 * phone don't both read `SiteName`. Saved in `app_settings`.
 */
export const PwaInstallNameSettingKey = "install_name";
export const PwaInstallNameMaxLength = 30;

/**
 * How much of the canvas the stone fills on the app icon, and on a
 * maskable icon (cropped to a circle of 80% of the canvas, so the stone
 * stays well inside it).
 */
export const PwaAppIconMarkScale = 0.8;
export const PwaMaskableMarkScale = 0.52;

/**
 * The install's own icon (Settings > General): one of the stones, or an
 * uploaded image with the stone as a corner mark. Saved as JSON in
 * `app_settings`; the generated PNGs live in `DATA_DIR/<PwaInstallIconDir>`
 * and are served from `<PwaInstallIconRoute>/<version>/<file>.png`.
 */
export const PwaInstallIconSettingKey = "install_icon";
export const PwaInstallIconDir = "install-icon";
export const PwaInstallIconRoute = "/install-icon";
export const PwaInstallIconModes = ["stone", "image"] as const;
export type PwaInstallIconMode = (typeof PwaInstallIconModes)[number];

export type PwaInstallIcon = {
    mode: PwaInstallIconMode;
    stone: BotHue;
    /**
     * Image mode: put the stone in the top-left corner.
     */
    mark: boolean;
    /**
     * The generated set's folder, or null for the stock ember icon.
     */
    version: string | null;
};

export const PwaDefaultInstallIcon: PwaInstallIcon = {
    mode: "stone",
    stone: "ember",
    mark: true,
    version: null,
};

/**
 * The corner mark on an uploaded image: inside a launcher's circle crop
 * (the centre 80%), top-left, clear of the browser's badge bottom-right.
 * Fractions of the icon's side.
 */
export const PwaCornerMarkInset = 0.2;
export const PwaCornerMarkScale = 0.22;

/**
 * Uploads must be at least this many pixels on their shorter side, and are
 * kept as a square of the source size.
 */
export const PwaInstallIconMinSide = 512;
export const PwaInstallIconSourceSide = 1024;

export type PwaInstallIconFile = {
    name: string;
    size: number;
    /**
     * `plain` is the image without the mark (the settings preview);
     * `favicon` never gets the mark (unreadable at 32px).
     */
    kind: "any" | "maskable" | "favicon" | "plain";
};

/**
 * Every file a custom icon set holds. The `icon-*` and `maskable-*` names
 * match `PwaIcons`, so the manifest only swaps the folder.
 */
export const PwaInstallIconFiles: PwaInstallIconFile[] = [
    { name: "icon-192", size: 192, kind: "any" },
    { name: "icon-512", size: 512, kind: "any" },
    { name: "maskable-192", size: 192, kind: "maskable" },
    { name: "maskable-512", size: 512, kind: "maskable" },
    { name: "apple-touch-icon", size: 180, kind: "any" },
    { name: "favicon", size: 32, kind: "favicon" },
    { name: "plain-512", size: 512, kind: "plain" },
];
