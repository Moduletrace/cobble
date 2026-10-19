import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import NoBotsSection from "./(sections)/no-bots-section";

/**
 * Only rendered for a user who reaches no bot yet: `index.server.ts`
 * otherwise redirects to a conversation.
 */
export default function BotsPage() {
    return <NoBotsSection />;
}

export const meta: BunextPageModuleMeta = {
    title: `Bots | ${SiteData["SiteName"]}`,
    description: `Your crew of bots.`,
};
