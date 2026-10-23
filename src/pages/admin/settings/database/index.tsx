import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";
import DatabaseBrowser from "./(sections)/database-browser";

export default function AdminSettingsDatabasePage() {
    return (
        <SettingsShell
            title="Database"
            description="Every table and every record, read-only: open a record to read a value whole, search a table across all of its columns."
            wide
        >
            <DatabaseBrowser />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Database" });
