export type ThemeVars = {
    /**
     * The `:root` block's `--c-*` colours, keyed with their `--` names.
     */
    light: Record<string, string>;
    /**
     * The `.dark` block's `--c-*` colours.
     */
    dark: Record<string, string>;
    /**
     * `--font-sans` and `--font-mono` from the `@theme inline` block.
     */
    fonts: Record<string, string>;
};

/**
 * The app's neutral colours (light and dark) and font stacks from
 * `src/styles/main.css`, for documents served outside the app's own
 * styles (a bot graphic), so they match the theme without a copy of it.
 */
export default function parseThemeVars({ css }: { css: string }): ThemeVars {
    return {
        light: blockVars({ block: css.match(/(?:^|\n):root\s*\{([\s\S]*?)\n\}/)?.[1], prefix: "--c-" }),
        dark: blockVars({ block: css.match(/(?:^|\n)\.dark\s*\{([\s\S]*?)\n\}/)?.[1], prefix: "--c-" }),
        fonts: blockVars({ block: css.match(/@theme\s+inline\s*\{([\s\S]*?)\n\}/)?.[1], prefix: "--font-" }),
    };
}

function blockVars({ block, prefix }: { block?: string; prefix: string }) {
    const vars: Record<string, string> = {};

    if (!block) return vars;

    for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/g)) {
        const [, name, value] = match;

        if (name?.startsWith(prefix) && value) vars[name] = value.replace(/\s+/g, " ").trim();
    }

    return vars;
}
