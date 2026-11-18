import HostDirectoriesSection from "./(sections)/host-directories-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsHostDirectoriesPage() {
    return (
        <SettingsShell
            title="Host directories"
            description="Folders on the machine Cobble runs on, mounted in your computers."
        >
            <HostDirectoriesSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Host directories" });