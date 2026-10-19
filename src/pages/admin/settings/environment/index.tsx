import EnvironmentSettingsSection from "./(sections)/environment-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsEnvironmentPage() {
    return (
        <SettingsShell
            title="Environment"
            description="Keys and settings your bots and computers use."
        >
            <EnvironmentSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Environment" });
