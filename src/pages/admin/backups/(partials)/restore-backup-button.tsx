import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { DbBackup } from "@/src/types";
import restoreBackup from "../(functions)/restore-backup";
import { ArchiveRestore } from "lucide-react";

type Props = {
    backup: DbBackup;
};

export default function RestoreBackupButton({ backup }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();

    const restore_backup = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await restoreBackup({ backup });

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
        <Row className="gap-2! flex-nowrap justify-end">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <Button
                title="Restore Backup"
                variant="outlined"
                color="warning"
                size="small"
                beforeIcon={<ArchiveRestore size={20} />}
                loading={loading}
                onClick={() => {
                    restore_backup();
                }}
            >
                Restore
            </Button>
        </Row>
    );
}
