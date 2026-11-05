/**
 * How long an idle browser waits before its tabs are parked, from a whole
 * number of seconds (`COBBLE_BROWSER_PARK_AFTER_SECONDS`): 0 turns parking
 * off, anything unreadable is the default, 3 minutes.
 */
export default function parkAfterMs({ text }: { text?: string }) {
    const value = String(text ?? "").trim();

    if (!/^\d+$/.test(value)) return 180_000;

    return Number(value) * 1000;
}
