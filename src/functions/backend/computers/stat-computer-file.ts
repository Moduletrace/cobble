import computerJson from "./computer-json";
import type { ComputerApi } from "./computer-fetch";

export type ComputerFileStat =
    | { exists: false }
    | { exists: true; type: "file" | "directory" | "other"; size: number; mtime_ms: number };

/**
 * What's at an absolute path on a computer.
 */
export default function statComputerFile({ computer, path, signal }: { computer: ComputerApi; path: string; signal?: AbortSignal }) {
    return computerJson<ComputerFileStat>({
        computer,
        path: `/api/files/stat?path=${encodeURIComponent(path)}`,
        timeout_ms: 30_000,
        signal,
    });
}
