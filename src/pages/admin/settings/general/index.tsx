import AppearanceSection from "./(sections)/appearance-section";
import StorageSection from "./(sections)/storage-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsGeneralPage() {
    return (
        <SettingsShell
            title="General"
            description="How the app looks and behaves."
        >
            <AppearanceSection />
            <StorageSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "General" });
