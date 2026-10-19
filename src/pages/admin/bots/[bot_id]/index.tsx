import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Conversation from "./(sections)/conversation";

export default function BotConversationPage() {
    return <Conversation />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const bot = (params.serverRes?.props as PagePropsType | undefined)?.bot;

    return {
        title: `${bot?.name || "Bots"} | ${SiteData["SiteName"]}`,
        description: bot?.role || `Your crew of bots.`,
    };
};
