import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { SiteData } from "../data/site-data";
import {
    PwaIcons,
    PwaManifestName,
    PwaManifestPath,
    PwaOfflinePath,
    PwaScope,
    PwaShortName,
    PwaShortcuts,
    PwaStartPath,
} from "../data/pwa-data";

const ROOT = path.resolve(import.meta.dir, "../..");
const LOGO_SVG = path.join(ROOT, "public/logos/logo.svg");
const PUBLIC_DIR = path.join(ROOT, "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");
const MAIN_CSS = path.join(ROOT, "src/styles/main.css");

const ICO_SIZES = [16, 24, 32, 48] as const;
const PNG_SIZES = [...ICO_SIZES, 180, 512] as const;

/**
 * The app icon is the stone on paper, with room around it for the
 * launcher's mask. The favicons keep the transparent stone.
 */
const AppIconMarkScale = 0.8;
/**
 * A maskable icon is cropped to a circle of 80% of the canvas, so the
 * stone stays inside it with room to spare.
 */
const MaskableMarkScale = 0.52;

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

async function renderAppIcon({
    svg,
    size,
    scale,
    background,
}: {
    svg: Buffer;
    size: number;
    scale: number;
    background: string;
}) {
    const mark_size = Math.max(1, Math.round(size * scale));
    const mark = await sharp(svg)
        .resize(mark_size, mark_size, { fit: "contain" })
        .png()
        .toBuffer();

    return sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background,
        },
    })
        .composite([{ input: mark, gravity: "center" }])
        .png()
        .toBuffer();
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
    font-family: "Lato", system-ui, -apple-system, "Segoe UI", sans-serif;
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
            scale: AppIconMarkScale,
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
                scale: maskable ? MaskableMarkScale : AppIconMarkScale,
                background: colors.paper,
            }),
        );
    }

    writeFileSync(
        path.join(PUBLIC_DIR, "manifest.webmanifest"),
        `${JSON.stringify(buildManifest({ colors }), null, 4)}\n`,
    );

    writeFileSync(
        path.join(PUBLIC_DIR, "offline.html"),
        buildOfflinePage({ colors, logo: inlineLogo(await Bun.file(LOGO_SVG).text()) }),
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
    console.log("  public/manifest.webmanifest      (name, colors and icons)");
    console.log("  public/offline.html              (self-contained offline page)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Brand asset generation failed:", error);
        process.exit(1);
    });
