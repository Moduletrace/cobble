/**
 * Chrome's device scale factor from `COBBLE_BROWSER_SCALE` (e.g. `1`),
 * else 1.25: text is larger in bots' screenshots, and 1920x1080 reads as
 * 1536x864, the most common laptop. Kept between 1 and 3. The app's
 * `ComputerDefaultBrowserScale` is the same default.
 */
export default function browserScale({ text }: { text?: string }) {
    const scale = Number(text);

    return text && Number.isFinite(scale) && scale >= 1 && scale <= 3 ? scale : 1.25;
}
