import Span from "@moduletrace/twui/layout/Span";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import UploadRestoreFields from "@/src/components/general/upload-restore-fields";
import uploadBootstrapRestore from "../(functions)/upload-bootstrap-restore";
import type { DataBackupRun } from "@/src/types";

type Props = {
    open: boolean;
    onClose: () => void;
    /**
     * Hands the restore the upload started to the page to follow.
     */
    onStarted: (run: DataBackupRun) => void;
};

/**
 * Setting a new install up from another one's backup: a database file
 * downloaded from Settings > Backups, or a whole-data archive.
 */
export default function BootstrapRestoreModal({ open, onClose, onStarted }: Props) {
    return (
        <AddModalShell
            open={open}
            setOpen={(next) => !next && onClose()}
            title="Restore from a backup"
            description="Upload a database file or a whole-data .tar.gz archive from Settings > Backups of another install. Its accounts, bots and settings become this install's, and the app restarts."
        >
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                Provider keys, environment values and secrets open only with
                the old install&apos;s ENCRYPTION_KEY and ENCRYPTION_SALT. Copy
                both into this install&apos;s .env before you restore (the
                restart picks them up), or enter those values again after.
            </Span>
            {open ? (
                <UploadRestoreFields
                    label="Click or drop a database file or data archive"
                    accept=".db,.sqlite,.sqlite3,.tar.gz,.tgz,application/gzip"
                    action_label="Upload & restore"
                    upload={uploadBootstrapRestore}
                    onDone={({ run }) => {
                        if (run) onStarted(run);
                        onClose();
                    }}
                />
            ) : null}
        </AddModalShell>
    );
}
