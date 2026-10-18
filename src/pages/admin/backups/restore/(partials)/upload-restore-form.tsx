import FileUpload from "@moduletrace/twui/form/FileUpload";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { useState } from "react";
import uploadRestoreBackup from "../(functions)/upload-restore-backup";

export default function UploadRestoreForm() {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [file, setFile] = useState<File>();

    const upload_restore = async () => {
        if (!file) return;

        setStatus(undefined);
        setLoading(true);

        const res = await uploadRestoreBackup({ file });

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
        <Stack className="w-full items-stretch gap-4">
            <FileUpload
                label="Click or drop a SQLite database file"
                className="h-[220px]"
                fileInputProps={{ accept: ".db,.sqlite,.sqlite3" }}
                changeHandler={(file_data) => {
                    setStatus(undefined);
                    setFile(file_data?.file);
                }}
            />
            <Row className="w-full justify-end gap-2! flex-nowrap">
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                <Button
                    title="Upload And Restore Backup"
                    color="warning"
                    beforeIcon="Upload"
                    loading={loading}
                    disabled={!file || loading}
                    onClick={() => {
                        upload_restore();
                    }}
                >
                    Upload & restore
                </Button>
            </Row>
        </Stack>
    );
}
