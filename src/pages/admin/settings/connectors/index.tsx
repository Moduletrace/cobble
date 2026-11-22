import ConnectorsSettingsSection from "./(sections)/connectors-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsConnectorsPage() {
    return (
        <SettingsShell
            title="Connectors"
            description="Apps your bots work in as you: your own sign-in, never a shared password."
        >
            <ConnectorsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Connectors" });