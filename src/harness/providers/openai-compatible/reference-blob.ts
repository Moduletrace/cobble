import { AppData } from "@/src/data/app-data";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import HarnessError from "../../harness-error";

/**
 * A reference's bytes (an image or a video to work from): decoded from a
 * `data:` URL, downloaded otherwise.
 */
export default async function referenceBlob({ url, signal }: { url: string; signal: AbortSignal }) {
    if (url.startsWith("data:")) {
        const { buffer, ext } = await bufferFromBase64(url);
        const type = url.slice(5, url.indexOf(";")) || "image/png";

        return { blob: new Blob([new Uint8Array(buffer)], { type }), ext };
    }

    const download = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(AppData.HarnessRequestTimeoutMs)]),
    });

    if (!download.ok) {
        throw new HarnessError({ message: `A reference couldn't be downloaded.` });
    }

    const type = download.headers.get("content-type")?.split(";")[0] || "image/png";

    return { blob: new Blob([await download.arrayBuffer()], { type }), ext: type.split("/")[1] || "png" };
}
