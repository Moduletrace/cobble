import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects to
 * `SettingsDefaultPath`.
 */
export default function AdminSettingsPage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `Settings | ${SiteData["SiteName"]}`,
    description: "Redirecting to your profile settings.",
};
