import { PwaManifestPath } from "@/src/data/pwa-data";

/**
 * Runs before React mounts, in `<head>`:
 * - keeps `beforeinstallprompt` (it can fire before hydration, and only
 *   one prompt can ever be held)
 * - points the browser's theme color at the current theme's paper token,
 *   so it follows light/dark without repeating the color here
 * - lets the page use safe-area insets and resize under the on-screen
 *   keyboard (bunext emits a fixed viewport meta)
 */
const PwaInitScriptSource = `(function () {
    try {
        window.__cobbleInstallPrompt = null;
        window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault();
            window.__cobbleInstallPrompt = event;
            window.dispatchEvent(new CustomEvent("cobble:install-available"));
        });
        window.addEventListener("appinstalled", function () {
            window.__cobbleInstallPrompt = null;
            window.dispatchEvent(new CustomEvent("cobble:installed"));
        });
    } catch (e) {}

    try {
        var meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.setAttribute(
                "content",
                "width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content",
            );
        }
    } catch (e) {}

    try {
        var theme_meta = document.querySelector('meta[name="theme-color"]');
        if (!theme_meta) {
            theme_meta = document.createElement("meta");
            theme_meta.setAttribute("name", "theme-color");
            document.head.appendChild(theme_meta);
        }
        var apply_theme_color = function () {
            var paper = getComputedStyle(document.documentElement)
                .getPropertyValue("--c-paper")
                .trim();
            if (paper) theme_meta.setAttribute("content", paper);
        };
        apply_theme_color();
        window.addEventListener("load", apply_theme_color);
        var dark_query = window.matchMedia("(prefers-color-scheme: dark)");
        if (dark_query.addEventListener) dark_query.addEventListener("change", apply_theme_color);
        new MutationObserver(apply_theme_color).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    } catch (e) {}
})();`;

export default function PwaInitScript() {
    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: PwaInitScriptSource }} />
            <link rel="manifest" href={PwaManifestPath} />
        </>
    );
}
