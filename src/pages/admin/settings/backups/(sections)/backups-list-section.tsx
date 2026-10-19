import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import SettingsGroup from "../../(partials)/settings-group";
import { AppContext } from "@/src/pages/__root";
import CreateBackupButton from "../(partials)/create-backup-button";
import BackupsTable, { type BackupsTableMode } from "../(partials)/backups-table";

type Props = {
    mode: BackupsTableMode;
};

/**
 * The database snapshots, newest first. On the restore page each row
 * restores; otherwise each one downloads, and a new backup can be made.
 */
export default function BackupsListSection({ mode }: Props) {
    const { pageProps } = useContext(AppContext);
    const backups = pageProps?.backups || [];
    const is_restore = mode == "restore";

    return (
        <SettingsGroup
            title={is_restore ? "Saved snapshots" : "Snapshots"}
            description={
                is_restore
                    ? "Restore any of these, or upload a file below. Create a fresh backup first if you might need the current data."
                    : "Older snapshots are pruned automatically. Download one to keep it."
            }
        >
            <Row className="w-full items-center justify-between gap-2! flex-wrap">
                <Span size="small" variant="faded">
                    {`${backups.length} backup${backups.length == 1 ? "" : "s"}`}
                </Span>
                {is_restore ? null : <CreateBackupButton />}
            </Row>
            {backups[0] ? (
                <BackupsTable backups={backups} mode={mode} />
            ) : (
                <Span size="small" variant="faded">
                    No backups yet.
                </Span>
            )}
        </SettingsGroup>
    );
}
