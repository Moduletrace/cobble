import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import computerFetch, { type ComputerApi } from "./computer-fetch";
import computerRunAsQuery from "./computer-run-as-query";
import statComputerFile from "./stat-computer-file";

type Params = {
    computer: ComputerApi;
    /**
     * The file on the computer, absolute.
     */
    path: string;
    /**
     * Refuse it above this many bytes.
     */
    max_bytes: number;
    /**
     * Only inside this worker's own folders (`ComputerRunDirs.run_as`): a
     * link it left there pointing elsewhere is refused.
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

export type ComputerDownload =
    | { ok: true; bytes: Buffer; size: number }
    | { ok: false; reason: "missing" | "too_big" | "cut_short"; size: number };

/**
 * A computer's file, byte for byte, streamed by its agent
 * (`/api/files/download`), never through a shell, whose output is capped
 * and would silently cut a big file short. The size is read first so
 * nothing over the limit is sent; the agent cuts the transfer when the
 * file changes while it's sent, and the length is checked, so a short
 * transfer is reported instead of being saved.
 */
export default async function downloadComputerFile({ computer, path, max_bytes, run_as, signal }: Params): Promise<ComputerDownload> {
    const stat = await statComputerFile({ computer, path, run_as, signal });

    if (!stat.exists || stat.type != "file") return { ok: false, reason: "missing", size: 0 };
    if (stat.size > max_bytes) return { ok: false, reason: "too_big", size: stat.size };

    const res = await computerFetch({
        computer,
        path: `/api/files/download?path=${encodeURIComponent(path)}${computerRunAsQuery({ run_as })}`,
        timeout_ms: stat.size > 5 * 1024 * 1024 ? 120_000 : 60_000,
        signal,
    });

    if (res.status == 404) return { ok: false, reason: "missing", size: 0 };
    if (!res.ok) throw new Error(`The computer refused to send ${path}: ${res.status}`);

    const bytes = await res
        .arrayBuffer()
        .then((buffer) => Buffer.from(buffer))
        .catch(() => null);

    if (!bytes || bytes.byteLength != stat.size) {
        return { ok: false, reason: "cut_short", size: bytes?.byteLength || 0 };
    }

    return { ok: true, bytes, size: stat.size };
}
