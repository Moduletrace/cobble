import BotsSettingsSection from "./(sections)/bots-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsBotsPage() {
    return (
        <SettingsShell title="Bots" description="Your crew: the coordinator and the bots it hands work to.">
            <BotsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Bots" });
