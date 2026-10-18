import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";

/**
 * Never rendered: `index.server.ts` always redirects to `/auth/login`.
 */
export default function AuthPage() {
    return null;
}

export const meta: BunextPageModuleMeta = {
    title: `Log In | ${SiteData["SiteName"]}`,
    description: "Redirecting to login.",
};
