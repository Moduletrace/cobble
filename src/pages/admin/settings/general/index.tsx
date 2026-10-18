import AppearanceSection from "./(sections)/appearance-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsGeneralPage() {
    return (
        <SettingsShell
            title="General"
            description="How the app looks and behaves."
        >
            <AppearanceSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "General" });
