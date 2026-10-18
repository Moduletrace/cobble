import Button from "@moduletrace/twui/layout/Button";
import type { DbBackup } from "@/src/types";
import { Download } from "lucide-react";

type Props = {
    backup: DbBackup;
};

export default function DownloadBackupButton({ backup }: Props) {
    return (
        <Button
            title="Download Backup"
            variant="outlined"
            color="gray"
            size="small"
            beforeIcon={<Download size={20} />}
            href={`/api/admin/backups/download?backup_name=${encodeURIComponent(backup.name)}`}
            linkProps={{
                download: backup.name,
                onClick: (e) => {
                    if (!window.confirm(`Download backup ${backup.name}?`)) {
                        e.preventDefault();
                    }
                },
            }}
        >
            Download
        </Button>
    );
}
