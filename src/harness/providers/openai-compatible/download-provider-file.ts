import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import providerDownloadUrlProblem from "./provider-download-url";

type Params = {
    url: string;
    max_bytes: number;
    signal: AbortSignal;
    /** Names the provider in a failure, so a benched model says whose URL failed. */
    label: string;
};

type Downloaded = {
    data: Uint8Array<ArrayBuffer>;
    media_type: string;
};

/**
 * Downloads a file a provider hands back by URL (H4): https only, internal
 * addresses refused, every redirect hop re-checked, and the body read in
 * chunks under a byte cap so a huge response can't fill the app's memory.
 * Every failure - a malformed URL, a refused address, an aborted or broken
 * download - is a `HarnessError`, so `withCandidates` can bench the model
 * and fall back rather than letting a plain `TypeError` escape the loop.
 */
export default async function downloadProviderFile({ url, max_bytes, signal, label }: Params): Promise<Downloaded> {
    const fail = (message: string) =>
        new HarnessError({ message: `${label}: ${message}`, retryable: true });

    let current = url;

    for (let hop = 0; hop < 5; hop++) {
        const problem = providerDownloadUrlProblem({ url: current });

        if (problem) throw fail(problem);

        let res: Response;

        try {
            res = await fetch(current, {
                redirect: "manual",
                signal: AbortSignal.any([signal, AbortSignal.timeout(AppData.HarnessRequestTimeoutMs)]),
            });
        } catch (error) {
            throw fail(error instanceof Error ? `couldn't download the file (${error.message}).` : "couldn't download the file.");
        }

        if (res.status >= 300 && res.status < 400) {
            const location = res.headers.get("location");

            if (!location) throw fail("redirected without a destination.");

            current = new URL(location, current).toString();
            continue;
        }

        if (!res.ok) throw fail(`the file download failed (${res.status}).`);

        const media_type = res.headers.get("content-type")?.split(";")[0] || "image/png";
        const data = await readCapped({ res, max_bytes, fail });

        return { data, media_type };
    }

    throw fail("redirected too many times.");
}

type ReadParams = {
    res: Response;
    max_bytes: number;
    fail: (message: string) => HarnessError;
};

/**
 * Reads the body in chunks, refusing it the moment it passes the cap rather
 * than buffering it whole. A stream that breaks or is aborted mid-read is
 * a `HarnessError` too, never a raw DOMException.
 */
async function readCapped({ res, max_bytes, fail }: ReadParams): Promise<Uint8Array<ArrayBuffer>> {
    const body = res.body;

    if (!body) {
        const buffer = new Uint8Array(await res.arrayBuffer().catch(() => null as unknown as ArrayBuffer));

        if (!buffer) throw fail("the download was interrupted.");
        if (buffer.length > max_bytes) throw fail("the file is larger than allowed.");

        return buffer;
    }

    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        for (;;) {
            const { done, value } = await reader.read();

            if (done) break;

            if (value) {
                total += value.length;

                if (total > max_bytes) {
                    await reader.cancel().catch(() => {});
                    throw fail("the file is larger than allowed.");
                }

                chunks.push(value);
            }
        }
    } catch (error) {
        if (error instanceof HarnessError) throw error;
        throw fail(error instanceof Error ? `the download was interrupted (${error.message}).` : "the download was interrupted.");
    }

    const out = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }

    return out;
}
