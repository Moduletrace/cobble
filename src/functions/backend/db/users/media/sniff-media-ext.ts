import type { MediaDataType } from "@/src/types";
import MediaDataToArrayBuffer from "./media-data-to-array-buffer";

export default async function sniffMediaExtension(
    data: MediaDataType,
): Promise<string | undefined> {
    try {
        const bytes = new Uint8Array(await MediaDataToArrayBuffer(data));

        if (bytes.length < 12) return undefined;

        const has = (...signature: number[]) =>
            signature.every((byte, i) => bytes[i] === byte);

        if (has(0xff, 0xd8, 0xff)) return "jpg";
        if (has(0x89, 0x50, 0x4e, 0x47)) return "png";
        if (has(0x47, 0x49, 0x46, 0x38)) return "gif";
        if (has(0x25, 0x50, 0x44, 0x46)) return "pdf";
        if (has(0x50, 0x4b, 0x03, 0x04)) return "zip";
        if (has(0x49, 0x44, 0x33)) return "mp3";
        if (has(0x4f, 0x67, 0x67, 0x53)) return "ogg";

        if (has(0x52, 0x49, 0x46, 0x46)) {
            const riff_type = String.fromCharCode(
                bytes[8]!,
                bytes[9]!,
                bytes[10]!,
                bytes[11]!,
            );

            if (riff_type === "WEBP") return "webp";
            if (riff_type === "WAVE") return "wav";
        }

        if (
            String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!) ===
            "ftyp"
        ) {
            return "mp4";
        }

        const head = String.fromCharCode(...bytes.subarray(0, 8)).trimStart();

        if (head.startsWith("<svg") || head.startsWith("<?xml")) return "svg";

        return undefined;
    } catch (error) {
        return undefined;
    }
}
