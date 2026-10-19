import SettingsGroup from "../../../(partials)/settings-group";
import UploadRestoreForm from "../(partials)/upload-restore-form";

/**
 * Restoring from a file on this machine, for a backup kept elsewhere.
 */
export default function UploadRestoreSection() {
    return (
        <SettingsGroup
            title="From a file"
            description="Upload a SQLite database file. It is saved to the backups list, then restored."
        >
            <UploadRestoreForm />
        </SettingsGroup>
    );
}
