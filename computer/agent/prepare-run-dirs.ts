import { chmodSync, chownSync, mkdirSync } from "node:fs";
import { AgentConfig } from "./config";

/**
 * The folders the services need, owned by the computer's user: the run
 * dir (bus, pid, state), its private runtime dir, the X socket dir, and
 * the home folders (a fresh mount may arrive owned by root).
 */
export default function prepareRunDirs() {
    const { Uid, Gid } = AgentConfig;

    for (const [dir, mode] of [
        [AgentConfig.RunDir, 0o755],
        [`${AgentConfig.RunDir}/xdg`, 0o700],
        [AgentConfig.Home, 0o755],
        [AgentConfig.WorkspaceDir, 0o755],
        [AgentConfig.ProfileDir, 0o700],
        [`${AgentConfig.Home}/.cobble`, 0o700],
    ] as const) {
        mkdirSync(dir, { recursive: true });
        chownSync(dir, Uid, Gid);
        chmodSync(dir, mode);
    }

    mkdirSync("/tmp/.X11-unix", { recursive: true });
    chmodSync("/tmp/.X11-unix", 0o1777);
}
