import AppearanceSection from "./(sections)/appearance-section";
import ChatroomRetentionSection from "./(sections)/chatroom-retention-section";
import HookCallRetentionSection from "./(sections)/hook-call-retention-section";
import InstallIconSection from "./(sections)/install-icon-section";
import InstallNameSection from "./(sections)/install-name-section";
import LogRetentionSection from "./(sections)/log-retention-section";
import NotificationsSection from "./(sections)/notifications-section";
import PromptSection from "./(sections)/prompt-section";
import RunLimitsSection from "./(sections)/run-limits-section";
import SessionLengthSection from "./(sections)/session-length-section";
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
            <InstallNameSection />
            <InstallIconSection />
            <AppearanceSection />
            <NotificationsSection />
            <PromptSection />
            <RunLimitsSection />
            <SessionLengthSection />
            <SkillLimitsSection />
            <HookCallRetentionSection />
            <ChatroomRetentionSection />
            <LogRetentionSection />
            <StorageSection />
            <VersionSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "General" });
