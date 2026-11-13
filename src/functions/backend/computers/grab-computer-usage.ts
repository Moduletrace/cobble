import type { ComputerApi } from "./computer-fetch";
import computerJson from "./computer-json";

type Params = {
    computer: ComputerApi;
    signal?: AbortSignal;
};

export type ComputerUsageFolder = {
    /**
     * Relative to the workspace root: `bots/9` is a bot's folder,
     * `workspaces/3` a workspace's shared one.
     */
    path: string;
    bytes: number;
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
    /**
     * The biggest folders in it, most first. A computer whose agent is
     * older than this sends none.
     */
    folders?: ComputerUsageFolder[];
};

/**
 * What a computer's workspace holds (`GET /api/usage` on its agent). The
 * agent measures with `du` and reuses the answer for a few seconds, so
 * asking before each write costs little.
 */
export default function grabComputerUsage({ computer, signal }: Params) {
    return computerJson<ComputerUsage>({ computer, path: "/api/usage", timeout_ms: 60_000, signal });
}