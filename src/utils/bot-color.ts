import { BotHues, BotStoneShapes, type BotStoneShape } from "@/src/dict/bot-dict";

/**
 * A bot's colour is free (`#rrggbb`) and its stone shape is its own, so the
 * two are stored apart. These helpers are the only place that decides what a
 * bot actually renders in: the colour to fill its stone with and the shape
 * to draw it on.
 */

const HexColorPattern = /^#[0-9a-f]{6}$/;

/**
 * A stored colour as `#rrggbb`, or null when it isn't one. Accepts the short
 * `#rgb` form someone typed, so a hand-entered value still saves.
 */
export function normalizeBotColor({ color }: { color?: string | null }): string | null {
    const trimmed = (color || "").trim().toLowerCase();

    if (!trimmed) return null;

    const short = trimmed.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);

    if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;

    return HexColorPattern.test(trimmed) ? trimmed : null;
}

/**
 * The hex a palette entry stands for, by its name.
 */
export function paletteColor({ hue }: { hue?: string | null }): string | null {
    return BotHues.find((entry) => entry.value == hue)?.color || null;
}

/**
 * The colour a bot renders in: its own, else the palette colour of a bot
 * saved before colours were free, else (the coordinator) nothing at all.
 */
export function resolveBotColor({
    color,
    hue,
}: {
    color?: string | null;
    hue?: string | null;
}): string | null {
    return normalizeBotColor({ color }) || paletteColor({ hue });
}

/**
 * The stone a bot is drawn on: its own shape, else the palette shape it used
 * to be tied to, else the first stone.
 */
export function resolveBotStone({
    stone,
    hue,
}: {
    stone?: string | null;
    hue?: string | null;
}): BotStoneShape {
    const shape = BotStoneShapes.find((entry) => entry.value == stone)?.value;

    if (shape) return shape;

    const carried = BotStoneShapes.find((entry) => entry.value == hue)?.value;

    return carried || BotStoneShapes[0].value;
}

/**
 * Relative luminance of a `#rrggbb` colour, 0 (black) to 1 (white), so the
 * stone's face can be flipped to paper on a dark body and stays readable.
 */
export function botColorLuminance({ color }: { color: string }): number {
    const hex = normalizeBotColor({ color }) || "#ffffff";
    const [red, green, blue] = [1, 3, 5].map((at) => {
        const value = parseInt(hex.slice(at, at + 2), 16) / 255;

        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

/**
 * Whether the stone's eyes must be drawn in paper instead of ink. Only a
 * very dark body needs it, so a mid-tone keeps the ink face every other
 * stone has.
 */
export function botColorNeedsPaperFace({ color }: { color: string }): boolean {
    return botColorLuminance({ color }) < 0.12;
}

/**
 * The palette name a colour is, for a label ("Violet"); null for a colour
 * the user made up, which the UI shows as a custom one.
 */
export function paletteColorTitle({ color }: { color?: string | null }): string | null {
    const normalized = normalizeBotColor({ color });

    if (!normalized) return null;

    return BotHues.find((entry) => entry.color == normalized)?.title || null;
}
