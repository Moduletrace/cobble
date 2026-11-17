import { AppData } from "@/src/data/app-data";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import downloadProviderFile from "./download-provider-file";

/**
 * A reference's bytes (an image or a video to work from): decoded from a
 * `data:` URL, downloaded otherwise. The download is guarded like any
 * provider URL (H4 / R7): https only, internal addresses refused, capped,
 * and every failure a `HarnessError`. Callers pass `data:` URLs today; the
 * guard keeps a future URL caller from reopening the SSRF/OOM hole.
 */
export default async function referenceBlob({ url, signal }: { url: string; signal: AbortSignal }) {
    if (url.startsWith("data:")) {
        const { buffer, ext } = await bufferFromBase64(url);
        const type = url.slice(5, url.indexOf(";")) || "image/png";

        return { blob: new Blob([new Uint8Array(buffer)], { type }), ext };
    }

    const { data, media_type } = await downloadProviderFile({
        url,
        // A reference may be a still or a video; the larger of the two caps
        // covers both without buffering an unbounded body.
        max_bytes: Math.max(AppData.ImageReferenceMaxBytes, AppData.VideoSourceMaxBytes),
        signal,
        label: "A reference",
    });

    return { blob: new Blob([data], { type: media_type }), ext: media_type.split("/")[1] || "png" };
}
