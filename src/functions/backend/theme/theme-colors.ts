import fs from "fs";
import path from "path";
import parseThemeColors from "@/src/utils/parse-theme-colors";

/**
 * Site theme colors for server-rendered output (emails, PDFs) that cannot use
 * Tailwind classes. Read from the `@theme inline` block in
 * `src/styles/main.css`, so theme changes there flow through automatically.
 */
function grabCssThemeColors(): Record<string, string> {
    try {
        const css = fs.readFileSync(
            path.join(process.cwd(), "src/styles/main.css"),
            "utf-8",
        );
        return parseThemeColors({ css });
    } catch {
        return {};
    }
}

const css_colors = grabCssThemeColors();

function themeColor({ name, fallback }: { name: string; fallback: string }) {
    return css_colors[name] || fallback;
}

export const ThemeColors = {
    /** Main text / ink */
    ink: themeColor({ name: "primary", fallback: "#101828" }),
    /** Brand emphasis (bars, highlights, accents) */
    accent: themeColor({ name: "accent", fallback: "#5b5bd6" }),
    /** Body copy */
    body: themeColor({ name: "slate-700", fallback: "#344054" }),
    /** Secondary/muted copy */
    muted: themeColor({ name: "slate-500", fallback: "#667085" }),
    /** Borders and dividers */
    hairline: themeColor({ name: "slate-200", fallback: "#e4e7ec" }),
    /** Table header / subtle fills */
    subtle: themeColor({ name: "slate-100", fallback: "#f2f4f7" }),
    /** Zebra rows / faint fills */
    faint: themeColor({ name: "slate-50", fallback: "#f9fafb" }),
    /** Page canvas */
    page: themeColor({ name: "light", fallback: "#f7f8fa" }),
    /** Cards / paper */
    surface: themeColor({ name: "background-light", fallback: "#ffffff" }),
} as const;
