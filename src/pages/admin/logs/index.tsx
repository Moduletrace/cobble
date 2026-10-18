import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Hero from "./(sections)/hero";
import LogsListSection from "./(sections)/logs-list-section";

export default function LogsPage() {
    return (
        <>
            <Hero />
            <LogsListSection />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    return {
        title: `Logs | ${SiteData["SiteName"]}`,
        description: "System activity and audit logs",
    };
};
