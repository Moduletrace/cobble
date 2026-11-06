import type { RunUser } from "./run-user-for";

/**
 * The environment a worker's commands get: its own home and identity,
 * and nothing of gem's (no screen, no session bus, no cookie), so it can
 * reach neither the browser nor gem's services.
 */
export default function workerEnv({ run_user }: { run_user: RunUser }): NodeJS.ProcessEnv {
    return {
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        HOME: run_user.home,
        USER: run_user.name,
        LOGNAME: run_user.name,
        SHELL: "/bin/bash",
        LANG: process.env.LANG || "C.UTF-8",
        TZ: process.env.TZ || "UTC",
        PIP_BREAK_SYSTEM_PACKAGES: "1",
    };
}
