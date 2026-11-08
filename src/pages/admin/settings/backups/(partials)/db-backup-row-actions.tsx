import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { DataBackupRun, DbBackup } from "@/src/types";
import restoreBackup from "../(functions)/restore-backup";
import deleteDbBackup from "../(functions)/delete-db-backup";
import RowIconButton from "@/src/components/general/row-icon-button";
import { ArchiveRestore, Download, Trash2 } from "lucide-react";
import { useContext } from "react";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";

type Props = {
    backup: DbBackup;
};

/**
 * One database snapshot's icon actions: restore, download or delete, with
 * their own one-line status. A restore runs in the background and restarts
 * the app, so its run goes to the page to follow.
 */
export default function DbBackupRowActions({ backup }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();
    const { run: running, track } = useContext(DataBackupRunContext);
    const busy = loading || Boolean(running);

    const run = async (
        task: () => Promise<{ success: boolean; msg?: string; run?: DataBackupRun }>,
    ) => {
        setStatus(undefined);
        setLoading(true);

        const res = await task();

        if (res.success && res.run) {
            setLoading(false);
            track(res.run);
            return;
        }

        if (res.success) {
            window.location.reload();
            return;
        }

        setLoading(false);

        if (res.msg) {
            setStatus({ error: true, msg: res.msg });
        }
    };

    return (
        <Row className="gap-1! flex-nowrap justify-end">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <RowIconButton
                icon={ArchiveRestore}
                title="Restore this snapshot"
                disabled={busy}
                onClick={() => {
                    run(() => restoreBackup({ backup }));
                }}
            />
            <RowIconButton
                icon={Download}
                title="Download this snapshot"
                href={`/api/admin/backups/download?backup_name=${encodeURIComponent(backup.name)}`}
                linkProps={{
                    download: backup.name,
                    onClick: (e) => {
                        if (!window.confirm(`Download backup ${backup.name}?`)) {
                            e.preventDefault();
                        }
                    },
                }}
            />
            <RowIconButton
                icon={Trash2}
                title="Delete this snapshot"
                disabled={busy}
                onClick={() => {
                    run(() => deleteDbBackup({ backup }));
                }}
            />
        </Row>
    );
}
