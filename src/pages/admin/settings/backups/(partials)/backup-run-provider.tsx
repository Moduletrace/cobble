import type { PropsWithChildren } from "react";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import useDataBackupRun from "../(hooks)/use-data-backup-run";

/**
 * Follows the background run going on the server (`useDataBackupRun`)
 * for the whole page, so both lists see it and neither starts another.
 */
export default function BackupRunProvider({ children }: PropsWithChildren) {
    const data_backup_run = useDataBackupRun();

    return (
        <DataBackupRunContext.Provider value={data_backup_run}>
            {children}
        </DataBackupRunContext.Provider>
    );
}
