import Hero from "./(sections)/hero";
import AccountFormSection from "./(sections)/account-form-section";
import settingsPageMeta from "./(functions)/settings-page-meta";

export default function AdminSettingsPage() {
    return (
        <>
            <Hero section_title="Profile" />
            <AccountFormSection />
        </>
    );
}

export const meta = settingsPageMeta({ label: "Profile" });
