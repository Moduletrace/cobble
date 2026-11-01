import BrowsersSettingsSection from "./(sections)/browsers-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsBrowsersPage() {
    return (
        <SettingsShell
            title="Browsers"
            description="Your own running browsers, for your bots to use with your logins. They only ever work for you."
        >
            <BrowsersSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Browsers" });
