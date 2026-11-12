import type { ComputerApi } from "./computer-fetch";
import computerJson from "./computer-json";

type Params = {
    computer: ComputerApi;
    signal?: AbortSignal;
};

export type ComputerUsage = {
    /**
     * How much the whole workspace holds, every bot's and user's folder
     * included.
     */
    used_bytes: number;
    /**
     * Where it is on the computer, for messages.
     */
    workspace_dir: string;
};

/**
 * What a computer's workspace holds (`GET /api/usage` on its agent). The
 * agent measures with `du` and reuses the answer for a few seconds, so
 * asking before each write costs little.
 */
export default function grabComputerUsage({ computer, signal }: Params) {
    return computerJson<ComputerUsage>({ computer, path: "/api/usage", timeout_ms: 30_000, signal });
}