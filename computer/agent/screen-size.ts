/**
 * A screen size from `WIDTHxHEIGHT`, else 1920x1080 (the most common
 * desktop, so the browser's screen gives nothing away).
 */
export default function screenSize({ text }: { text?: string }) {
    const match = String(text || "").match(/^(\d{3,5})x(\d{3,5})$/);

    return match ? { width: Number(match[1]), height: Number(match[2]) } : { width: 1920, height: 1080 };
}
