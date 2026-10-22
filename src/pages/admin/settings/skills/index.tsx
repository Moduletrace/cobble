import SkillsSettingsSection from "./(sections)/skills-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsSkillsPage() {
    return (
        <SettingsShell title="Skills" description="Runbooks your bots follow when a job matches one.">
            <SkillsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Skills" });
