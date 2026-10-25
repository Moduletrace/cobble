import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";
import RoutinesSection from "./(sections)/routines-section";
import HooksSection from "./(sections)/hooks-section";

export default function AdminRoutinesPage() {
    return (
        <SettingsShell title="Routines" description="Work your bots do on their own: on a schedule, or when an outside service calls a hook.">
            <RoutinesSection />
            <HooksSection />
        </SettingsShell>
    );
}

export const meta: BunextPageModuleMetaFn = async () => {
    return {
        title: `Routines | ${SiteData["SiteName"]}`,
        description: "Work your bots do on a schedule.",
    };
};
