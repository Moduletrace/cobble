import { Archive, Upload } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import createDataBackup from "../(functions)/create-data-backup";
import UploadRestoreModal from "../(partials)/upload-restore-modal";
import { useState } from "react";

/**
 * The data archive list's two ways in: make a fresh archive, or restore
 * one from a file.
 */
export default function DataBackupListActions() {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [uploading, setUploading] = useState(false);

    const create_backup = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await createDataBackup();

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
                title="Restore from an archive file"
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
                title="Create Data Archive"
                beforeIcon={<Archive />}
                loading={loading}
                onClick={() => {
                    create_backup();
                }}
            >
                Create archive
            </Button>
            <UploadRestoreModal
                open={uploading}
                onClose={() => setUploading(false)}
                is_data
            />
        </Row>
    );
}
