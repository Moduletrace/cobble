import Button from "@moduletrace/twui/layout/Button";
import { ArchiveRestore } from "lucide-react";
import SettingsGroup from "../../(partials)/settings-group";
import { SettingsBackupsRestorePath } from "@/src/dict/settings-pages-dict";

/**
 * The way into the restore page from the backups list.
 */
export default function RestoreBackupsSection() {
    return (
        <SettingsGroup
            title="Restore"
            description="Replace all current data with the contents of a saved or uploaded backup. This cannot be undone."
        >
            <Button
                title="Restore backup"
                href={SettingsBackupsRestorePath}
                variant="outlined"
                color="warning"
                size="small"
                beforeIcon={<ArchiveRestore size={20} />}
                className="self-start"
            >
                Restore a backup
            </Button>
        </SettingsGroup>
    );
}
