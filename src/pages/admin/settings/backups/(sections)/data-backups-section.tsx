import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import SettingsGroup from "../../(partials)/settings-group";
import { AppContext } from "@/src/pages/__root";
import DataBackupListActions from "../(partials)/data-backup-list-actions";
import DataBackupRunNotice from "../(partials)/data-backup-run-notice";
import DataBackupsTable from "../(partials)/data-backups-table";

/**
 * The tar.gz archives of the whole data volume, newest first. Each one
 * restores (replacing every folder and the database snapshots with the
 * archive's own, then the app restarts), downloads or deletes; the newest
 * `AppData.DataBackupsKept` are kept and older ones pruned. Archives and
 * restores run in the background on the server; the page follows the one
 * running (`BackupRunProvider`) for every control on it.
 */
export default function DataBackupsSection() {
    const { pageProps } = useContext(AppContext);
    const backups = pageProps?.data_backups || [];

    return (
        <SettingsGroup
            title="Data archives"
            description="One tar.gz of the install's data, under a single folder named after the archive: the database, media, every bot and workspace file, and the database snapshots. Computers' own folders are left out, since they are that computer's state and often the largest thing on the volume. The archives live outside the data volume, and the newest few are kept."
        >
            <Row className="w-full items-center justify-between gap-2! flex-wrap">
                <Span size="small" variant="faded">
                    {`${backups.length} archive${backups.length == 1 ? "" : "s"}`}
                </Span>
                <DataBackupListActions />
            </Row>
            <DataBackupRunNotice />
            {backups[0] ? (
                <DataBackupsTable backups={backups} />
            ) : (
                <Span size="small" variant="faded">
                    No archives yet.
                </Span>
            )}
        </SettingsGroup>
    );
}
