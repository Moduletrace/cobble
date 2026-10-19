import ModelsSettingsSection from "./(sections)/models-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsModelsPage() {
    return (
        <SettingsShell
            title="Models"
            description="What your bots think, read, hear and speak with."
        >
            <ModelsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Models" });
