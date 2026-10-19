import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import HelpTopicsSection from "./(sections)/help-topics-section";

export default function AdminHelpPage() {
    return (
        <SettingsShell title="Help" description="Familiar problems, and how to get past them.">
            <HelpTopicsSection />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Help | ${SiteData["SiteName"]}`,
        description: `Familiar problems on ${SiteData["SiteName"]}, and how to get past them.`,
    };
};
