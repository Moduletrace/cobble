import ProfileFormSection from "./(sections)/profile-form-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsProfilePage() {
    return (
        <SettingsShell title="Profile" description="Your details on this install.">
            <ProfileFormSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Profile" });
