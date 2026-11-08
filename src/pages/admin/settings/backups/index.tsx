import BackupsListSection from "./(sections)/backups-list-section";
import DataBackupsSection from "./(sections)/data-backups-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";
import BackupRunProvider from "./(partials)/backup-run-provider";

export default function AdminSettingsBackupsPage() {
    return (
        <SettingsShell
            title="Backups"
            description="Database snapshots and whole-data archives: make them, restore from one, and delete them."
            wide
        >
            <BackupRunProvider>
                <BackupsListSection />
                <DataBackupsSection />
            </BackupRunProvider>
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Backups" });
