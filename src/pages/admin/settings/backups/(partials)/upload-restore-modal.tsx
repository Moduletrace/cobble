import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import UploadRestoreFields from "./upload-restore-fields";
import uploadRestoreBackup from "../(functions)/upload-restore-backup";
import uploadRestoreDataBackup from "../(functions)/upload-restore-data-backup";
import { DataBackupRunContext } from "../(data)/data-backup-run-context";
import type { DataBackupRun } from "@/src/types";
import { useContext } from "react";

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
 * whole data volume in the background, so the modal closes and the
 * section follows the run until the app is back from its restart.
 */
export default function UploadRestoreModal({ open, onClose, is_data }: Props) {
    const { track } = useContext(DataBackupRunContext);

    const done = ({ run }: { run?: DataBackupRun }) => {
        if (!is_data || !run) {
            window.location.reload();
            return;
        }

        track(run);
        onClose();
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
                    onDone={done}
                />
            ) : null}
        </AddModalShell>
    );
}
