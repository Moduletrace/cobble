import AppError from "@/src/utils/app-error";
import type { DataBackupRun, DataBackupRunKind } from "@/src/types";
import withBackupRunLock, { isBackupRunning } from "./with-backup-run-lock";

/**
 * Changes every time the process starts, so the page can tell a restore
 * restarted the app (the run it started belonged to another boot).
 */
export const BootId = crypto.randomUUID();

let run: Omit<DataBackupRun, "boot_id"> | null = null;

type Params = {
    kind: DataBackupRunKind;
    /**
     * The archive or restore itself. It resolves to the archive's name.
     */
    task: () => Promise<string>;
};

/**
 * Starts a whole-data archive or restore in the background and hands back
 * its state at once. Both take far longer than a request may stay silent
 * (Bun closes an idle socket after 10s, a proxy after about 100s), so the
 * route answers straight away and the page polls `data-status` until the
 * run is done or failed. Throws while any backup or restore is running,
 * before anything starts.
 */
export function startDataBackupRun({ kind, task }: Params): DataBackupRun {
    if (isBackupRunning() || run?.status == "running") {
        throw new AppError(`Another backup or restore is already running`);
    }

    const started = {
        kind,
        status: "running" as const,
        started_at: Date.now(),
    };

    run = started;

    withBackupRunLock({ task })
        .then((name) => {
            if (run !== started) return;
            run = { ...started, status: "done", name, finished_at: Date.now() };
        })
        .catch((error: unknown) => {
            if (run !== started) return;
            run = {
                ...started,
                status: "failed",
                error: error instanceof Error ? error.message : String(error),
                finished_at: Date.now(),
            };
        });

    return grabDataBackupRun();
}

/**
 * The last whole-data run this process started, if any, with this boot's
 * id.
 */
export function grabDataBackupRun(): DataBackupRun {
    return { ...(run ?? { status: "idle" }), boot_id: BootId };
}
