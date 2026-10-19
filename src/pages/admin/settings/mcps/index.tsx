import McpsSettingsSection from "./(sections)/mcps-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsMcpsPage() {
    return (
        <SettingsShell title="MCPs" description="MCP servers whose tools your bots can use.">
            <McpsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "MCPs" });
