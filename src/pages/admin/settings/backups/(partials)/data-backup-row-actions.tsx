import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { DataBackup } from "@/src/types";
import restoreDataBackup from "../(functions)/restore-data-backup";
import deleteDataBackup from "../(functions)/delete-data-backup";
import RowIconButton from "@/src/components/general/row-icon-button";
import { ArchiveRestore, Download, Trash2 } from "lucide-react";
import { useContext } from "react";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";

type Props = {
    backup: DataBackup;
};

/**
 * One data archive's icon actions: restore (replaces the whole data
 * volume, then the app restarts), download or delete, with their own
 * one-line status. A restore runs in the background and the section
 * follows it, so every row waits while one is going.
 */
export default function DataBackupRowActions({ backup }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();
    const { run, track } = useContext(DataBackupRunContext);
    const busy = Boolean(run);

    const remove = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await deleteDataBackup({ backup });

        if (res.success) {
            window.location.reload();
            return;
        }

        setLoading(false);

        if (res.msg) {
            setStatus({ error: true, msg: res.msg });
        }
    };

    const restore = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await restoreDataBackup({ backup });

        setLoading(false);

        if (res.run) {
            track(res.run);
            return;
        }

        if (res.msg) {
            setStatus({ error: true, msg: res.msg });
        }
    };

    return (
        <Row className="gap-1! flex-nowrap justify-end">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <RowIconButton
                icon={ArchiveRestore}
                title="Restore this archive"
                loading={loading}
                disabled={busy}
                onClick={() => {
                    restore();
                }}
            />
            <RowIconButton
                icon={Download}
                title="Download this archive"
                href={`/api/admin/backups/download-data?backup_name=${encodeURIComponent(backup.name)}`}
                linkProps={{
                    download: backup.name,
                    onClick: (e) => {
                        if (!window.confirm(`Download archive ${backup.name}?`)) {
                            e.preventDefault();
                        }
                    },
                }}
            />
            <RowIconButton
                icon={Trash2}
                title="Delete this archive"
                disabled={loading || busy}
                onClick={() => {
                    remove();
                }}
            />
        </Row>
    );
}
