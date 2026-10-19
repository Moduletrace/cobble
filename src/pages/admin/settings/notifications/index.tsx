import NotificationsSection from "./(sections)/notifications-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsNotificationsPage() {
    return (
        <SettingsShell
            title="Notifications"
            description="When a bot needs you, and which devices hear about it."
        >
            <NotificationsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Notifications" });
