import { Archive, Upload } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import createDataBackup from "../(functions)/create-data-backup";
import UploadRestoreModal from "../(partials)/upload-restore-modal";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import { useContext, useState } from "react";

/**
 * The data archive list's two ways in: make a fresh archive, or restore
 * one from a file. Also says how the archive or restore running now is
 * going, and why the last one failed.
 */
export default function DataBackupListActions() {
    const { loading, setLoading, status, setStatus } = useStatus();
    const { run, error, track } = useContext(DataBackupRunContext);
    const [uploading, setUploading] = useState(false);
    const archiving = run?.kind == "archive";
    const restoring = run?.kind == "restore";

    const create_backup = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await createDataBackup();

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
        <Row className="gap-2! flex-nowrap">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            {!status?.error && error && <Tag color="error">{error}</Tag>}
            {archiving && (
                <Tag color="warning">Archiving, this can take a while...</Tag>
            )}
            {restoring && (
                <Tag color="warning">Restoring, the app restarts soon...</Tag>
            )}
            <Button
                title="Restore from an archive file"
                variant="outlined"
                color="gray"
                beforeIcon={<Upload />}
                disabled={Boolean(run)}
                onClick={() => {
                    setUploading(true);
                }}
            >
                Restore from file
            </Button>
            <Button
                title="Create Data Archive"
                beforeIcon={<Archive />}
                loading={loading || archiving}
                disabled={Boolean(run)}
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
