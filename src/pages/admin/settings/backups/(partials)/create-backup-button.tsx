import { DatabaseBackup } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import createBackup from "../(functions)/create-backup";

export default function CreateBackupButton() {
    const { loading, setLoading, status, setStatus } = useStatus();

    const create_backup = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await createBackup();

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
        <Row className="gap-2! flex-nowrap">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <Button
                title="Create Backup"
                beforeIcon={<DatabaseBackup />}
                loading={loading}
                onClick={() => {
                    create_backup();
                }}
            >
                Create backup
            </Button>
        </Row>
    );
}
