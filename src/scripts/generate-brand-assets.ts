import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { SiteData } from "../data/site-data";
import { AppData } from "../data/app-data";
import { HashedAssetPattern } from "../utils/is-hashed-asset-path";
import {
    PwaBadgePath,
    PwaBadgeSize,
    PwaBuildInfoPath,
    PwaIcons,
    PwaLoadingNamePlaceholder,
    PwaPrecacheCachePrefix,
    PwaPrecacheMarkerPath,
    PwaServiceWorkerPath,
    PwaManifestName,
    PwaManifestPath,
    PwaOfflinePath,
    PwaScope,
    PwaShortName,
    PwaShortcuts,
    PwaStartPath,
    PwaAppIconMarkScale,
    PwaMaskableMarkScale,
} from "../data/pwa-data";
import renderAppIcon from "../functions/server/pwa/render-app-icon";

const ROOT = path.resolve(import.meta.dir, "../..");
const LOGO_SVG = path.join(ROOT, "public/logos/logo.svg");
const PUBLIC_DIR = path.join(ROOT, "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const MAIN_CSS = path.join(ROOT, "src/styles/main.css");

const ICO_SIZES = [16, 24, 32, 48] as const;
const PNG_SIZES = [...ICO_SIZES, 180, 512] as const;

function buildIco(pngs: Record<number, Buffer>): Buffer {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(ICO_SIZES.length, 4);

    const entries: Buffer[] = [];
    const blobs: Buffer[] = [];
    let offset = 6 + 16 * ICO_SIZES.length;

    for (const size of ICO_SIZES) {
        const blob = pngs[size]!;
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size, 0);
        entry.writeUInt8(size, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(blob.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += blob.length;
        entries.push(entry);
        blobs.push(blob);
    }

    return Buffer.concat([header, ...entries, ...blobs]);
}

/**
 * The app's font, loaded the way `src/pages/__root.tsx` loads it, so the
 * generated pages read like the app. Offline, the browser's cached copy is
 * used when it has one, else the fallbacks.
 */
const FontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..900&display=swap" />`;

/**
 * The status-bar icon Android draws from a notification's `badge`. Only
 * the alpha channel counts, so it is the stone's silhouette alone, white
 * on transparent (the app icons sit on opaque paper and mask to a square).
 */
async function renderBadge({ svg, size }: { svg: Buffer; size: number }) {
    const silhouette = await sharp(svg)
        .resize(Math.round(size * 0.84), Math.round(size * 0.84), { fit: "contain" })
        .ensureAlpha()
        .extractChannel("alpha")
        .toBuffer();

    const mark = await sharp({
        create: {
            width: Math.round(size * 0.84),
            height: Math.round(size * 0.84),
            channels: 3,
            background: "#ffffff",
        },
    })
        .joinChannel(silhouette)
        .png()
        .toBuffer();

    return sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([{ input: mark, gravity: "center" }])
        .png()
        .toBuffer();
}

function escapeHtml(text: string) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

type ThemeColors = {
    paper: string;
    ink: string;
    ink_secondary: string;
    hairline: string;
    dark_paper: string;
    dark_ink: string;
    dark_ink_secondary: string;
    dark_hairline: string;
};

/**
 * The theme's colors come from `src/styles/main.css`, the only place they
 * are defined, so the manifest and the offline page never drift from it.
 */
async function grabThemeColors(): Promise<ThemeColors> {
    const css = await Bun.file(MAIN_CSS).text();
    const root_block = css.match(/:root\s*\{([^}]*)\}/s)?.[1] || "";
    const dark_block = css.match(/\.dark\s*\{([^}]*)\}/s)?.[1] || "";

    const token = (block: string, name: string) =>
        block.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

    const paper = token(root_block, "c-paper");
    const ink = token(root_block, "c-ink");
    const ink_secondary = token(root_block, "c-ink-secondary");
    const hairline = token(root_block, "c-border");
    const dark_paper = token(dark_block, "c-paper");
    const dark_ink = token(dark_block, "c-ink");
    const dark_ink_secondary = token(dark_block, "c-ink-secondary");
    const dark_hairline = token(dark_block, "c-border");

    if (
        !paper ||
        !ink ||
        !ink_secondary ||
        !hairline ||
        !dark_paper ||
        !dark_ink ||
        !dark_ink_secondary ||
        !dark_hairline
    ) {
        throw new Error("Cobble color tokens not found in src/styles/main.css");
    }

    return {
        paper,
        ink,
        ink_secondary,
        hairline,
        dark_paper,
        dark_ink,
        dark_ink_secondary,
        dark_hairline,
    };
}

function buildManifest({ colors }: { colors: ThemeColors }) {
    return {
        id: "/",
        name: PwaManifestName,
        short_name: PwaShortName,
        description: "Your crew of small AI worker bots.",
        lang: "en",
        dir: "ltr",
        start_url: PwaStartPath,
        scope: PwaScope,
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "any",
        background_color: colors.paper,
        theme_color: colors.paper,
        categories: ["productivity", "utilities"],
        prefer_related_applications: false,
        icons: PwaIcons,
        shortcuts: PwaShortcuts,
    };
}

function buildOfflinePage({
    colors,
    logo,
}: {
    colors: ThemeColors;
    logo: string;
}) {
    const name = escapeHtml(SiteData["SiteName"]);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="${colors.paper}" />
<title>Offline | ${name}</title>
<link rel="manifest" href="${PwaManifestPath}" />
${FontLinks}
<style>
:root {
    --paper: ${colors.paper};
    --ink: ${colors.ink};
    --ink-secondary: ${colors.ink_secondary};
    --hairline: ${colors.hairline};
    color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
    :root {
        --paper: ${colors.dark_paper};
        --ink: ${colors.dark_ink};
        --ink-secondary: ${colors.dark_ink_secondary};
        --hairline: ${colors.dark_hairline};
    }
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));
    background: var(--paper);
    color: var(--ink);
    font-family: "Archivo", "Liberation Sans", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
}
main {
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
}
h1 {
    margin: 8px 0 0;
    font-size: 28px;
    line-height: 1.1;
    letter-spacing: -0.03em;
}
p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink-secondary);
}
button {
    margin-top: 12px;
    height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 8px;
    background: var(--ink);
    color: var(--paper);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}
button:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
</style>
</head>
<body>
<main>
${logo}
<h1>${name}</h1>
<p>You're offline.</p>
<p>Reconnect to keep working with your bots. Anything you sent before you lost the connection is still on its way.</p>
<button type="button" onclick="location.reload()">Try again</button>
</main>
</body>
</html>
`;
}

/**
 * The page a browser gets instead of the app while it downloads a build
 * it hasn't yet (`handlePrecacheGate`). The server fills in `{{build}}`
 * (`{ build_id, total }`). The page downloads every file the running
 * build lists at `/build-info.json` into that build's cache itself, so it
 * works whichever service worker version is in charge, then checks every
 * one is in the cache (downloading any that aren't again, up to
 * `PrecacheVerifyPasses` more times) before the marker goes in. It drops
 * the old build's cache and hands over to a new worker waiting behind an
 * older one (nothing of the app runs here). It then sets the build cookie and
 * reloads into the app. Without Cache Storage, after a failed download,
 * or once nothing has landed for `PrecacheStallMs`, it sets the cookie
 * anyway, so the app runs from the network instead of never opening.
 */
function buildLoadingPage({
    colors,
    logo,
}: {
    colors: ThemeColors;
    logo: string;
}) {
    const name = escapeHtml(SiteData["SiteName"]);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="${colors.paper}" />
<meta name="robots" content="noindex" />
<title>${PwaLoadingNamePlaceholder}</title>
<link rel="manifest" href="${PwaManifestPath}" />
${FontLinks}
<style>
:root {
    --paper: ${colors.paper};
    --ink: ${colors.ink};
    --ink-secondary: ${colors.ink_secondary};
    --hairline: ${colors.hairline};
    color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
    :root {
        --paper: ${colors.dark_paper};
        --ink: ${colors.dark_ink};
        --ink-secondary: ${colors.dark_ink_secondary};
        --hairline: ${colors.dark_hairline};
    }
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));
    background: var(--paper);
    color: var(--ink);
    font-family: "Archivo", "Liberation Sans", system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
}
main {
    width: 100%;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
}
h1 { margin: 4px 0 0; font-size: 16px; line-height: 24px; }
p { margin: 0; font-size: 13px; line-height: 18px; color: var(--ink-secondary); }
.track { width: 100%; height: 4px; border-radius: 999px; background: var(--hairline); overflow: hidden; }
.bar { width: 0; height: 100%; border-radius: 999px; background: var(--ink); transition: width 200ms; }
.count { font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bar { transition: none; } }
</style>
</head>
<body>
<main role="status" aria-live="polite">
${logo}
<h1>Getting ${name} ready</h1>
<p id="note">Saving the app on this device, so it opens fast from now on.</p>
<div class="track"><div class="bar" id="bar"></div></div>
<p class="count" id="count"></p>
</main>
<script>
(function (BUILD) {
    var build_id = BUILD.build_id;
    var total = BUILD.total;
    var saved = 0;
    var last_change = Date.now();
    var finished = false;
    var hashed = new RegExp(${JSON.stringify(HashedAssetPattern.source)});
    var bar = document.getElementById("bar");
    var count = document.getElementById("count");
    var note = document.getElementById("note");

    var render = function () {
        var done = Math.min(saved, total);
        count.textContent = done + " of " + total + " files";
        bar.style.width = (total ? Math.round((done / total) * 100) : 100) + "%";
    };

    var enter = function () {
        if (finished) return;
        finished = true;
        clearInterval(stall_timer);
        document.cookie =
            "${AppData["BuildCookieName"]}=" + encodeURIComponent(build_id) +
            "; Path=/; Max-Age=${AppData["BuildCookieMaxAgeSeconds"]}; SameSite=Lax" +
            (location.protocol === "https:" ? "; Secure" : "");
        if (document.cookie.indexOf("${AppData["BuildCookieName"]}=") < 0) {
            note.textContent =
                "Turn on cookies for this site to open ${name}.";
            return;
        }
        location.reload();
    };

    var stall_timer = setInterval(function () {
        if (Date.now() - last_change > ${AppData["PrecacheStallMs"]}) enter();
    }, 1000);

    render();

    if (!("caches" in window) || !window.isSecureContext) return enter();

    /**
     * Resolves once the newest worker is the active one, telling one
     * that waits behind an older version to take over.
     */
    var worker = new Promise(function (resolve) {
        if (!("serviceWorker" in navigator)) return resolve();
        setTimeout(resolve, ${AppData["PrecacheWorkerWaitMs"]});
        var skip = function (w) {
            if (w && w.state === "installed") w.postMessage({ type: "SKIP_WAITING" });
        };
        navigator.serviceWorker
            .register("${PwaServiceWorkerPath}", { scope: "/", updateViaCache: "none" })
            .then(function (reg) {
                return reg
                    .update()
                    .catch(function () {})
                    .then(function () {
                        return reg;
                    });
            })
            .then(function (reg) {
                var check = setInterval(function () {
                    skip(reg.waiting);
                    if (reg.active && !reg.waiting && !reg.installing) {
                        clearInterval(check);
                        resolve();
                    }
                }, 200);
            })
            .catch(function () {
                resolve();
            });
    });

    var download = fetch("${PwaBuildInfoPath}", { cache: "no-store" })
        .then(function (response) {
            if (!response.ok) throw new Error("No build info");
            return response.json();
        })
        .then(function (build) {
            build_id = build.build_id;
            total = build.files.length;
            render();
            var cache_name = "${PwaPrecacheCachePrefix}" + build_id;
            return caches
                .keys()
                .then(function (keys) {
                    return Promise.all(
                        keys
                            .filter(function (key) {
                                return key.indexOf("${PwaPrecacheCachePrefix}") === 0 && key !== cache_name;
                            })
                            .map(function (key) {
                                return caches.delete(key);
                            }),
                    );
                })
                .then(function () {
                    return caches.open(cache_name);
                })
                .then(function (cache) {
                    return cache.match("${PwaPrecacheMarkerPath}").then(function (marker) {
                        if (marker) return;
                        return save(cache, build.files, ${AppData["PrecacheVerifyPasses"]}).then(function () {
                            return cache.put("${PwaPrecacheMarkerPath}", new Response(build_id));
                        });
                    });
                });
        });

    /**
     * Downloads the files the cache doesn't have yet, then checks every
     * one of them is in it, going again for any that aren't. Rejects when
     * some are still missing after the last pass, so the marker only
     * goes in for a complete build.
     */
    var save = function (cache, files, passes) {
        var queue = [];
        return Promise.all(
            files.map(function (url) {
                return cache.match(url).then(function (hit) {
                    if (hit) return;
                    queue.push(url);
                });
            }),
        )
            .then(function () {
                saved = files.length - queue.length;
                last_change = Date.now();
                render();
                var work = function () {
                    var url = queue.shift();
                    if (!url) return Promise.resolve();
                    return fetch(url, { cache: hashed.test(url) ? "default" : "no-cache" })
                        .then(function (response) {
                            if (!response.ok) throw new Error(url + ": " + response.status);
                            return cache.put(url, response);
                        })
                        .then(
                            function () {
                                saved += 1;
                                last_change = Date.now();
                                render();
                            },
                            function () {},
                        )
                        .then(work);
                };
                var workers = [];
                for (var i = 0; i < ${AppData["PrecacheConcurrency"]}; i++) workers.push(work());
                return Promise.all(workers);
            })
            .then(function () {
                note.textContent = "Checking the saved files…";
                return Promise.all(
                    files.map(function (url) {
                        return cache.match(url).then(function (hit) {
                            return hit ? null : url;
                        });
                    }),
                );
            })
            .then(function (results) {
                var missing = results.filter(Boolean);
                if (!missing.length) return;
                if (passes <= 0) throw new Error(missing.length + " files missing");
                note.textContent = "Saving the app on this device, so it opens fast from now on.";
                return save(cache, files, passes - 1);
            });
    };

    Promise.all([download, worker]).then(enter, enter);
})({{build}});
</script>
</body>
</html>
`;
}

/**
 * The logo inline, so the offline page has no request to make while
 * offline. Its own width and height give way to ours.
 */
function inlineLogo(raw: string) {
    const cleaned = raw.replace(/<\?xml[^>]*\?>/, "").replace(/<!DOCTYPE[^>]*>/, "");
    return cleaned.replace(/<svg([^>]*)>/, (match, attrs: string) => {
        const trimmed = attrs
            .replace(/\swidth="[^"]*"/, "")
            .replace(/\sheight="[^"]*"/, "");
        return `<svg width="48" height="48" role="img" aria-label="${escapeHtml(
            SiteData["SiteName"],
        )}"${trimmed}>`;
    });
}

async function main() {
    if (!existsSync(LOGO_SVG)) {
        throw new Error(`Logo SVG not found at ${LOGO_SVG}`);
    }

    const svg = Buffer.from(await Bun.file(LOGO_SVG).arrayBuffer());
    const colors = await grabThemeColors();

    const pngs: Record<number, Buffer> = {};
    for (const size of PNG_SIZES) {
        pngs[size] = await sharp(svg)
            .resize(size, size)
            .png()
            .toBuffer();
    }

    writeFileSync(path.join(PUBLIC_DIR, "favicon.png"), pngs[32]!);
    writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), buildIco(pngs));
    writeFileSync(
        path.join(PUBLIC_DIR, "apple-touch-icon.png"),
        await renderAppIcon({
            svg,
            size: 180,
            scale: PwaAppIconMarkScale,
            background: colors.paper,
        }),
    );
    mkdirSync(path.join(PUBLIC_DIR, "logos"), { recursive: true });
    writeFileSync(path.join(PUBLIC_DIR, "logos/logo.png"), pngs[512]!);

    mkdirSync(ICONS_DIR, { recursive: true });

    for (const icon of PwaIcons) {
        const size = Number(icon.sizes.split("x")[0]);
        const maskable = icon.purpose == "maskable";

        writeFileSync(
            path.join(PUBLIC_DIR, icon.src.replace(/^\//, "")),
            await renderAppIcon({
                svg,
                size,
                scale: maskable ? PwaMaskableMarkScale : PwaAppIconMarkScale,
                background: colors.paper,
            }),
        );
    }

    writeFileSync(
        path.join(PUBLIC_DIR, PwaBadgePath.replace(/^\//, "")),
        await renderBadge({ svg, size: PwaBadgeSize }),
    );

    writeFileSync(
        path.join(PUBLIC_DIR, "manifest.webmanifest"),
        `${JSON.stringify(buildManifest({ colors }), null, 4)}\n`,
    );

    writeFileSync(
        path.join(PUBLIC_DIR, "offline.html"),
        buildOfflinePage({ colors, logo: inlineLogo(await Bun.file(LOGO_SVG).text()) }),
    );

    writeFileSync(
        path.join(PUBLIC_DIR, "loading.html"),
        buildLoadingPage({ colors, logo: inlineLogo(await Bun.file(LOGO_SVG).text()) }),
    );

    console.log("Generated brand and PWA assets from public/logos/logo.svg:");
    console.log("  public/favicon.ico               (16/24/32/48 multi-size)");
    console.log("  public/favicon.png               (32x32)");
    console.log("  public/apple-touch-icon.png      (180x180, opaque paper)");
    console.log("  public/logos/logo.png            (512x512)");
    console.log("  public/icons/icon-192.png        (app icon)");
    console.log("  public/icons/icon-512.png        (app icon)");
    console.log("  public/icons/maskable-192.png    (maskable, safe zone)");
    console.log("  public/icons/maskable-512.png    (maskable, safe zone)");
    console.log("  public/icons/badge-96.png        (notification badge, alpha only)");
    console.log("  public/manifest.webmanifest      (name, colors and icons)");
    console.log("  public/offline.html              (self-contained offline page)");
    console.log("  public/loading.html              (precache loading page)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Brand asset generation failed:", error);
        process.exit(1);
    });
