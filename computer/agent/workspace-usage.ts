import { execFile } from "node:child_process";
import { AgentConfig } from "./config";

/**
 * When the workspace was last measured, and what it held: the whole
 * folder, every bot's and user's included, since that is what grows on the
 * data volume.
 */
let measured = { bytes: 0, at: 0 };

/**
 * Measuring walks the whole workspace, so a run writing several files in a
 * row asks once. The app's quota is its own decision; this is only how
 * much is there.
 */
const CacheMs = 10_000;

/**
 * How many bytes the workspace holds, measured with `du` (which reads the
 * folders in C) and reused for `CacheMs`.
 */
export async function workspaceUsage() {
    if (measured.at && Date.now() - measured.at < CacheMs) return measured.bytes;

    measured = { bytes: await measureWorkspace(), at: Date.now() };

    return measured.bytes;
}

/**
 * The workspace's size through `du` (bytes), 0 when it can't be read: a
 * missing folder holds nothing.
 */
function measureWorkspace() {
    return new Promise<number>((resolve) => {
        execFile("du", ["-s", "-B1", "--", AgentConfig.WorkspaceDir], { timeout: 30_000 }, (error, stdout) => {
            if (error) return resolve(0);

            const bytes = Number(String(stdout).trim().split(/\s+/)[0]);

            resolve(Number.isFinite(bytes) && bytes > 0 ? bytes : 0);
        });
    });
}