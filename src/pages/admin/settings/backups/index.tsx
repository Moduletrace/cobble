import BackupsListSection from "./(sections)/backups-list-section";
import RestoreBackupsSection from "./(sections)/restore-backups-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsBackupsPage() {
    return (
        <SettingsShell
            title="Backups"
            description="Snapshots of the database, and restoring one."
            wide
        >
            <BackupsListSection mode="view" />
            <RestoreBackupsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Backups" });
