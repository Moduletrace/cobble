import { Archive, Upload } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import createDataBackup from "../(functions)/create-data-backup";
import UploadRestoreModal from "../(partials)/upload-restore-modal";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import { useContext, useState } from "react";

/**
 * The data archive list's two ways in: make a fresh archive, or restore
 * one from a file. How a run is going, and why one failed, is shown under
 * the row by `DataBackupRunNotice`, so the buttons never move.
 */
export default function DataBackupListActions() {
    const { loading, setLoading } = useStatus();
    const { run, track, report } = useContext(DataBackupRunContext);
    const [uploading, setUploading] = useState(false);
    const archiving = run?.kind == "archive";

    const create_backup = async () => {
        report(undefined);
        setLoading(true);

        const res = await createDataBackup();

        setLoading(false);

        if (res.run) {
            track(res.run);
            return;
        }

        if (res.msg) {
            report(res.msg);
        }
    };

    return (
        <Row className="gap-2! flex-nowrap">
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
