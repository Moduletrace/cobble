import { DatabaseBackup, Upload } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import createBackup from "../(functions)/create-backup";
import UploadRestoreModal from "../(partials)/upload-restore-modal";
import { useState } from "react";

/**
 * The database snapshot list's two ways in: make a fresh snapshot, or
 * restore one from a file.
 */
export default function BackupListActions() {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [uploading, setUploading] = useState(false);

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
                title="Restore from a file"
                variant="outlined"
                color="gray"
                beforeIcon={<Upload />}
                onClick={() => {
                    setUploading(true);
                }}
            >
                Restore from file
            </Button>
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
            <UploadRestoreModal
                open={uploading}
                onClose={() => setUploading(false)}
            />
        </Row>
    );
}
