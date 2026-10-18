/**
 * Extracts `--color-*: #hex;` tokens from the `@theme inline` block of a CSS
 * string. Keys are returned without the `--color-` prefix (e.g. `primary`,
 * `slate-500`).
 */
export default function parseThemeColors({
    css,
}: {
    css: string;
}): Record<string, string> {
    const theme_block = css.match(/@theme\s+inline\s*\{([\s\S]*?)\n\}/)?.[1];

    if (!theme_block) return {};

    const colors: Record<string, string> = {};
    const color_regex = /--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g;

    for (const match of theme_block.matchAll(color_regex)) {
        const [, name, value] = match;
        if (name && value) colors[name] = value.toLowerCase();
    }

    return colors;
}
