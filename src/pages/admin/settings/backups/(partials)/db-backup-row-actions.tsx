import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { DbBackup } from "@/src/types";
import restoreBackup from "../(functions)/restore-backup";
import deleteDbBackup from "../(functions)/delete-db-backup";
import RowIconButton from "@/src/components/general/row-icon-button";
import { ArchiveRestore, Download, Trash2 } from "lucide-react";

type Props = {
    backup: DbBackup;
};

/**
 * One database snapshot's icon actions: restore, download or delete, with
 * their own one-line status.
 */
export default function DbBackupRowActions({ backup }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();

    const run = async (task: () => Promise<{ success: boolean; msg?: string }>) => {
        setStatus(undefined);
        setLoading(true);

        const res = await task();

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
                disabled={loading}
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
                disabled={loading}
                onClick={() => {
                    run(() => deleteDbBackup({ backup }));
                }}
            />
        </Row>
    );
}
