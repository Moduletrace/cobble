import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import computerJson from "./computer-json";
import type { ComputerApi } from "./computer-fetch";

type Params = {
    computer: ComputerApi;
    /**
     * Absolute; missing folders are created.
     */
    path: string;
    content: string | Buffer;
    /**
     * Permission bits, e.g. `0o600`. Defaults to `0o644`.
     */
    mode?: number;
    /**
     * Written by a worker's own account (`ComputerRunDirs.run_as`), whose
     * permissions decide where it may write.
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

/**
 * Writes a whole file on a computer, owned by its user or the worker's
 * account it's written as (the agent's
 * `/api/files/write`, through a temporary file, so a reader never sees
 * half of it).
 */
export default function writeComputerFile({ computer, path, content, mode, run_as, signal }: Params) {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");

    return computerJson<{ ok: boolean; size: number }>({
        computer,
        path: "/api/files/write",
        body: { path, content: bytes.toString("base64"), encoding: "base64", ...(mode ? { mode } : {}), ...(run_as ? { run_as } : {}) },
        timeout_ms: 60_000,
        signal,
    });
}
