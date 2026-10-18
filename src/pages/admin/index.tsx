import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects to `AdminHomePath`.
 */
export default function AdminPage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `${SiteData["SiteName"]}`,
    description: "Redirecting to your bots.",
};
