import SecretsSettingsSection from "./(sections)/secrets-settings-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsSecretsPage() {
    return (
        <SettingsShell
            title="Secrets"
            description="Passwords, tokens and keys you gave your bots from the chat, or they saved for you. Bots use them by name and never see them."
        >
            <SecretsSettingsSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Secrets" });
