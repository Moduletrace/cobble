import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import SettingsGroup from "../../(partials)/settings-group";
import { AppContext } from "@/src/pages/__root";
import BackupListActions from "../(partials)/backup-list-actions";
import BackupsTable from "../(partials)/backups-table";

/**
 * The database snapshots, newest first. Each row restores, downloads or
 * deletes, and a fresh one can be made or uploaded. These are the
 * bun-sqlite snapshots in `db/.backups`, not the whole-data archives.
 */
export default function BackupsListSection() {
    const { pageProps } = useContext(AppContext);
    const backups = pageProps?.backups || [];

    return (
        <SettingsGroup
            title="Database snapshots"
            description="Consistent snapshots of the database only, kept beside it. Older ones are pruned automatically. Download one to keep it."
        >
            <Row className="w-full items-center justify-between gap-2! flex-wrap">
                <Span size="small" variant="faded">
                    {`${backups.length} backup${backups.length == 1 ? "" : "s"}`}
                </Span>
                <BackupListActions />
            </Row>
            {backups[0] ? (
                <BackupsTable backups={backups} />
            ) : (
                <Span size="small" variant="faded">
                    No backups yet.
                </Span>
            )}
        </SettingsGroup>
    );
}
