import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects.
 */
export default function WorkspacesPage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `Workspaces | ${SiteData["SiteName"]}`,
    description: `Your workspaces.`,
};
