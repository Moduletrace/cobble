import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects to the coordinator.
 */
export default function BotsPage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `Bots | ${SiteData["SiteName"]}`,
    description: `Your crew of bots.`,
};
