import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import UploadRestoreFields from "./upload-restore-fields";
import uploadRestoreBackup from "../(functions)/upload-restore-backup";
import uploadRestoreDataBackup from "../(functions)/upload-restore-data-backup";

/**
 * How long the app is given to come back after an archive restore
 * restarted it before the page is reloaded anyway.
 */
const RELOAD_DELAY_MS = 8000;

type Props = {
    open: boolean;
    onClose: () => void;
    /**
     * True for an upload listing a data archive, which restarts the app.
     */
    is_data?: boolean;
};

/**
 * Uploading a file and restoring it, in a modal over the list it came
 * from. A database file is restored in place; a data archive replaces the
 * whole data volume, so the page waits for the app to restart.
 */
export default function UploadRestoreModal({ open, onClose, is_data }: Props) {
    const reload = () => {
        if (!is_data) {
            window.location.reload();
            return;
        }

        setTimeout(() => {
            window.location.reload();
        }, RELOAD_DELAY_MS);
    };

    return (
        <AddModalShell
            open={open}
            setOpen={(next) => !next && onClose()}
            title={is_data ? "Restore from an archive" : "Restore from a file"}
            description={
                is_data
                    ? "Upload a whole-data tar.gz archive. It replaces every folder and the database snapshots, a safety archive is made first, and the app restarts."
                    : "Upload a SQLite database file. It is saved to the snapshots list, then restored."
            }
        >
            {open ? (
                <UploadRestoreFields
                    label={
                        is_data
                            ? "Click or drop a data archive"
                            : "Click or drop a SQLite database file"
                    }
                    accept={
                        is_data
                            ? ".tar.gz,.tgz,application/gzip"
                            : ".db,.sqlite,.sqlite3"
                    }
                    action_label={is_data ? "Upload & restore archive" : "Upload & restore"}
                    upload={
                        is_data
                            ? uploadRestoreDataBackup
                            : uploadRestoreBackup
                    }
                    onDone={reload}
                />
            ) : null}
        </AddModalShell>
    );
}
