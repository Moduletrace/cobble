import fs from "fs";
import path from "path";
import parseThemeVars, { type ThemeVars } from "@/src/utils/parse-theme-vars";

let cached: ThemeVars | null = null;

/**
 * The app's theme colours and fonts for graphics, read once from
 * `src/styles/main.css` so a theme change there reaches them too.
 */
export default function grabGraphicThemeVars(): ThemeVars {
    if (cached) return cached;

    try {
        cached = parseThemeVars({
            css: fs.readFileSync(path.join(process.cwd(), "src/styles/main.css"), "utf-8"),
        });
    } catch {
        cached = { light: {}, dark: {}, fonts: {} };
    }

    return cached;
}
