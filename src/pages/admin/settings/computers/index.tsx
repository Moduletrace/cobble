import ComputersSettingsSection from "./(sections)/computers-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsComputersPage() {
    return (
        <SettingsShell title="Computers" description="The machines your bots work on, and what each one gets.">
            <ComputersSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Computers" });
