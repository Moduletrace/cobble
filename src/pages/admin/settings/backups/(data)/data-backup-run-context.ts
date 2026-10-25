import React from "react";
import type { DataBackupRun } from "@/src/types";

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
     * Follows a run a request just started until it ends.
     */
    track: (run: DataBackupRun) => void;
};

/**
 * The whole-data run the backups page is waiting on, shared by the list's
 * actions, every archive row and the upload modal, so none of them starts
 * another while one is going.
 */
export const DataBackupRunContext = React.createContext<DataBackupRunState>({
    track: () => {},
});
