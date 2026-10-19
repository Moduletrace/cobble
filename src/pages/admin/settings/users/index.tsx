import UsersSettingsSection from "./(sections)/users-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsUsersPage() {
    return (
        <SettingsShell title="Users" description="Who can sign in to this install. Each has their own crew and computers.">
            <UsersSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Users" });
