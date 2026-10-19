import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import LogsListSection from "./(sections)/logs-list-section";

export default function LogsPage() {
    return (
        <SettingsShell
            title="Activity"
            description="Sign-ins, scheduled runs, cron and errors, newest first."
            wide
        >
            <LogsListSection />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Activity | ${SiteData["SiteName"]}`,
        description: "System activity and audit logs",
    };
};
