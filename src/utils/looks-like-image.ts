/**
 * Whether bytes start like a real image, by its signature. Enough to catch
 * text saved under an image's name (a truncated base64 string once reached
 * the user as a 2.6 KB "PNG" that would not open): a real PNG, JPEG, GIF,
 * WEBP or BMP always starts with its own magic. SVG is text and is checked
 * by the caller's extension, not here.
 */
export default function looksLikeImage({ bytes }: { bytes: Uint8Array }) {
    const head = bytes.subarray(0, 12);
    const starts = (...expected: number[]) => expected.every((byte, index) => head[index] == byte);

    if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return true;
    if (starts(0xff, 0xd8, 0xff)) return true;
    if (starts(0x47, 0x49, 0x46, 0x38)) return true;
    if (starts(0x42, 0x4d)) return true;

    return starts(0x52, 0x49, 0x46, 0x46) && head[8] == 0x57 && head[9] == 0x45 && head[10] == 0x42 && head[11] == 0x50;
}