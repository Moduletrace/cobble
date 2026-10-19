import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects. Workspace settings
 * live at `/admin/settings/workspaces/<id>`.
 */
export default function WorkspacePage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `Workspaces | ${SiteData["SiteName"]}`,
    description: `Your workspaces.`,
};
