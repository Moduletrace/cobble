import { AppData } from "@/src/data/app-data";

/**
 * Applies the saved color scheme to `<html>` before first paint, so pages
 * never flash light before twui's `ColorSchemeSelector` mounts. Mirrors the
 * selector's resolution order: `localStorage.theme`, then the OS preference.
 */
const ThemeInitScriptSource = `(function () {
    try {
        var theme = localStorage.getItem("${AppData["ThemeStorageKey"]}");
        if (theme !== "dark" && theme !== "light") {
            theme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        var root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
    } catch (e) {}
})();`;

export default function ThemeInitScript() {
    return (
        <script dangerouslySetInnerHTML={{ __html: ThemeInitScriptSource }} />
    );
}
