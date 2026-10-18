import type { BunextPageModuleMeta } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import EmptyCrew from "./(sections)/empty-crew";

export default function BotsPage() {
    return <EmptyCrew />;
}

export const meta: BunextPageModuleMeta = {
    title: `Bots | ${SiteData["SiteName"]}`,
    description: `Your crew of bots.`,
};
