import Hero from "../(sections)/hero";
import PasswordFormSection from "./(sections)/password-form-section";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsPasswordPage() {
    return (
        <>
            <Hero section_title="Password" />
            <PasswordFormSection />
        </>
    );
}

export const meta = settingsPageMeta({ label: "Password" });
