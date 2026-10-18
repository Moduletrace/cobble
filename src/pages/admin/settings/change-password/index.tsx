import PasswordFormSection from "./(sections)/password-form-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsChangePasswordPage() {
    return (
        <SettingsShell
            title="Change password"
            description="You log in with your email or username and this password."
        >
            <PasswordFormSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Password" });
