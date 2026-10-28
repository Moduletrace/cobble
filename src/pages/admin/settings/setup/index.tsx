import { SiteData } from "@/src/data/site-data";
import SetupSection from "./(sections)/setup-section";
import SettingsShell from "../(partials)/settings-shell";
import settingsPageMeta from "../(functions)/settings-page-meta";

export default function AdminSettingsSetupPage() {
    return (
        <SettingsShell
            title="Setup"
            description={`Get ${SiteData["SiteName"]} ready to work, a step at a time.`}
        >
            <SetupSection />
        </SettingsShell>
    );
}

export const meta = settingsPageMeta({ label: "Setup" });
