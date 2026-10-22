import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { DataBackup } from "@/src/types";
import restoreDataBackup from "../(functions)/restore-data-backup";
import deleteDataBackup from "../(functions)/delete-data-backup";
import RowIconButton from "@/src/components/general/row-icon-button";
import { ArchiveRestore, Download, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * How long the app is given to come back after a restore restarted it
 * before the page is reloaded anyway.
 */
const RELOAD_DELAY_MS = 8000;

type Props = {
    backup: DataBackup;
};

/**
 * One data archive's icon actions: restore (replaces the whole data
 * volume, then the app restarts), download or delete, with their own
 * one-line status.
 */
export default function DataBackupRowActions({ backup }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [restarting, setRestarting] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        return () => {
            if (timeout.current) clearTimeout(timeout.current);
        };
    }, []);

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

        if (res.success) {
            setRestarting(true);
            timeout.current = setTimeout(() => {
                window.location.reload();
            }, RELOAD_DELAY_MS);
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
            {restarting && (
                <Tag color="warning">Restoring, the app restarts soon...</Tag>
            )}
            <RowIconButton
                icon={ArchiveRestore}
                title="Restore this archive"
                loading={loading && !restarting}
                disabled={restarting}
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
                disabled={loading || restarting}
                onClick={() => {
                    remove();
                }}
            />
        </Row>
    );
}
