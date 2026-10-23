/**
 * The heights a day's bar can take, shortest first. A day's tokens are
 * placed on this scale rather than given a height in pixels, so every bar
 * is a static utility class the stylesheet already carries: no inline
 * style, and the theme still decides the colour.
 */
export const UsageBarHeights = [
    "h-0.5",
    "h-1",
    "h-1.5",
    "h-2",
    "h-2.5",
    "h-3",
    "h-4",
    "h-5",
    "h-6",
    "h-8",
    "h-10",
    "h-12",
    "h-14",
    "h-16",
    "h-20",
    "h-24",
];

/**
 * Where a value sits on that scale, against the window's busiest day. A
 * day with work on it is never shorter than one step, so it is visible.
 */
export function usageBarHeight({ value, max }: { value: number; max: number }) {
    if (value <= 0) return UsageBarHeights[0]!;

    const ratio = max > 0 ? value / max : 0;
    const step = Math.max(1, Math.round(ratio * (UsageBarHeights.length - 1)));

    return UsageBarHeights[Math.min(step, UsageBarHeights.length - 1)]!;
}
