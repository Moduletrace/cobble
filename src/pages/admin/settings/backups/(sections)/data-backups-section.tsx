import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import SettingsGroup from "../../(partials)/settings-group";
import { AppContext } from "@/src/pages/__root";
import DataBackupListActions from "../(partials)/data-backup-list-actions";
import DataBackupsTable from "../(partials)/data-backups-table";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import useDataBackupRun from "../(hooks)/use-data-backup-run";

/**
 * The tar.gz archives of the whole data volume, newest first. Each one
 * restores (replacing every folder and the database snapshots with the
 * archive's own, then the app restarts), downloads or deletes; the newest
 * `AppData.DataBackupsKept` are kept and older ones pruned. Archives and
 * restores run in the background on the server; the section follows the
 * one running (`useDataBackupRun`) for every control in it.
 */
export default function DataBackupsSection() {
    const { pageProps } = useContext(AppContext);
    const backups = pageProps?.data_backups || [];
    const data_backup_run = useDataBackupRun();

    return (
        <DataBackupRunContext.Provider value={data_backup_run}>
            <SettingsGroup
                title="Data archives"
                description="One tar.gz of the whole data volume, under a single folder named after the archive: the database, media, computer homes, every bot and workspace file, and the database snapshots. They live outside the data volume, and the newest few are kept."
            >
                <Row className="w-full items-center justify-between gap-2! flex-wrap">
                    <Span size="small" variant="faded">
                        {`${backups.length} archive${backups.length == 1 ? "" : "s"}`}
                    </Span>
                    <DataBackupListActions />
                </Row>
                {backups[0] ? (
                    <DataBackupsTable backups={backups} />
                ) : (
                    <Span size="small" variant="faded">
                        No archives yet.
                    </Span>
                )}
            </SettingsGroup>
        </DataBackupRunContext.Provider>
    );
}
