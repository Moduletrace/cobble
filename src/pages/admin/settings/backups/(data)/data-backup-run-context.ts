import React from "react";
import type { DataBackupRun, DataBackupRunKind } from "@/src/types";

export type DataBackupRunState = {
    /**
     * The archive or restore running now, while it runs.
     */
    run?: DataBackupRun;
    /**
     * Why the last run failed.
     */
    error?: string;
    /**
     * What the run that failed was doing, so its section shows why
     * (none for a run that couldn't start).
     */
    error_kind?: DataBackupRunKind;
    /**
     * Follows a run a request just started until it ends.
     */
    track: (run: DataBackupRun) => void;
    /**
     * Shows why a run couldn't start (or clears it with `undefined`).
     */
    report: (error?: string) => void;
};

/**
 * The background run the backups page is waiting on (an archive, or a
 * restore of either kind), shared by both lists' actions, every row and
 * the upload modals, so none of them starts another while one is going.
 */
export const DataBackupRunContext = React.createContext<DataBackupRunState>({
    track: () => {},
    report: () => {},
});
