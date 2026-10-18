/**
 * Converts `#rgb` / `#rrggbb` hex into `0-1` channel fractions (pdf-lib `rgb()`
 * input). Alpha in `#rrggbbaa` is ignored.
 */
export default function hexToRgbFractions({ hex }: { hex: string }): {
    r: number;
    g: number;
    b: number;
} {
    let clean = hex.replace("#", "");

    if (clean.length == 3 || clean.length == 4) {
        clean = clean
            .slice(0, 3)
            .split("")
            .map((char) => char + char)
            .join("");
    }

    const channel = (offset: number) =>
        (parseInt(clean.slice(offset, offset + 2), 16) || 0) / 255;

    return { r: channel(0), g: channel(2), b: channel(4) };
}
