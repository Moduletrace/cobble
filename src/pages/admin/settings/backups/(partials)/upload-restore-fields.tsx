import FileUpload from "@moduletrace/twui/form/FileUpload";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { useState } from "react";
import { Upload } from "lucide-react";

type Props = {
    /**
     * The file picker's hint, e.g. "Click or drop a SQLite database file".
     */
    label: string;
    /**
     * What the picker accepts, e.g. `.db,.sqlite,.sqlite3`.
     */
    accept?: string;
    /**
     * The button's label.
     */
    action_label: string;
    /**
     * Sends the file and reports the outcome.
     */
    upload: (params: { file: File }) => Promise<{ success: boolean; msg?: string }>;
    /**
     * Reload the page once it worked (the app restarts after an archive
     * restore, so the caller waits for it first).
     */
    onDone: () => void;
};

/**
 * Picks one file and sends it for a restore: shared by the database upload
 * and the data archive upload, which differ only in what they accept.
 */
export default function UploadRestoreFields({
    label,
    accept,
    action_label,
    upload,
    onDone,
}: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();
    const [file, setFile] = useState<File>();

    const send = async () => {
        if (!file) return;

        setStatus(undefined);
        setLoading(true);

        const res = await upload({ file });

        if (res.success) {
            onDone();
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
                label={label}
                className="h-[220px]"
                fileInputProps={accept ? { accept } : undefined}
                changeHandler={(file_data) => {
                    setStatus(undefined);
                    setFile(file_data?.file);
                }}
            />
            <Row className="w-full justify-end gap-2! flex-nowrap">
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                <Button
                    title={action_label}
                    color="warning"
                    beforeIcon={<Upload />}
                    loading={loading}
                    disabled={!file || loading}
                    onClick={() => {
                        send();
                    }}
                >
                    {action_label}
                </Button>
            </Row>
        </Stack>
    );
}
