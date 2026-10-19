import ToolsSettingsSection from "./(sections)/tools-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsToolsPage() {
    return (
        <SettingsShell title="Tools" description="Tools of your own your bots can call.">
            <ToolsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Tools" });
