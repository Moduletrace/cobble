import KnowledgebasesSettingsSection from "./(sections)/knowledgebases-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsKnowledgebasesPage() {
    return (
        <SettingsShell title="Knowledgebases" description="Documents your bots search before they answer.">
            <KnowledgebasesSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Knowledgebases" });
