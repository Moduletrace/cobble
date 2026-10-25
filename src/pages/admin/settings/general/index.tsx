import AppearanceSection from "./(sections)/appearance-section";
import NotificationsSection from "./(sections)/notifications-section";
import PromptSection from "./(sections)/prompt-section";
import RunLimitsSection from "./(sections)/run-limits-section";
import SkillLimitsSection from "./(sections)/skill-limits-section";
import StorageSection from "./(sections)/storage-section";
import VersionSection from "./(sections)/version-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsGeneralPage() {
    return (
        <SettingsShell
            title="General"
            description="How the app looks and behaves."
        >
            <AppearanceSection />
            <NotificationsSection />
            <PromptSection />
            <RunLimitsSection />
            <SkillLimitsSection />
            <StorageSection />
            <VersionSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "General" });
