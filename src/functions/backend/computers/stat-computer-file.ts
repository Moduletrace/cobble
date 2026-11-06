import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import computerJson from "./computer-json";
import type { ComputerApi } from "./computer-fetch";
import computerRunAsQuery from "./computer-run-as-query";

export type ComputerFileStat =
    | { exists: false }
    | { exists: true; type: "file" | "directory" | "other"; size: number; mtime_ms: number };

type Params = {
    computer: ComputerApi;
    path: string;
    /**
     * Only inside this worker's own folders (`ComputerRunDirs.run_as`).
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

/**
 * What's at an absolute path on a computer.
 */
export default function statComputerFile({ computer, path, run_as, signal }: Params) {
    return computerJson<ComputerFileStat>({
        computer,
        path: `/api/files/stat?path=${encodeURIComponent(path)}${computerRunAsQuery({ run_as })}`,
        timeout_ms: 30_000,
        signal,
    });
}
