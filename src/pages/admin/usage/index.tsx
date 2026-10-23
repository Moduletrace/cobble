import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import UsageSection from "./(sections)/usage-section";

export default function AdminUsagePage() {
    return (
        <SettingsShell
            title="Usage"
            description="What the crew's model calls spent: in total, day by day, and per model, so a model's cost and the work of a day are both readable."
            wide
        >
            <UsageSection />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Usage | ${SiteData["SiteName"]}`,
        description: "What the crew's model calls spent.",
    };
};
