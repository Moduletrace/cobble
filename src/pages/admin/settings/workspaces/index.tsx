import WorkspacesSettingsSection from "./(sections)/workspaces-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsWorkspacesPage() {
    return (
        <SettingsShell title="Workspaces" description="Projects with their own context, bots, computers and models.">
            <WorkspacesSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Workspaces" });
