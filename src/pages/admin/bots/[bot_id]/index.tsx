import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Conversation from "./(sections)/conversation";
import WorkingOnPanel from "./(sections)/working-on-panel";

export default function BotConversationPage() {
    return (
        <>
            <Conversation />
            <WorkingOnPanel />
        </>
    );
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const bot = (params.serverRes?.props as PagePropsType | undefined)?.bot;

    return {
        title: `${bot?.name || "Bots"} | ${SiteData["SiteName"]}`,
        description: bot?.role || `Your crew of bots.`,
    };
};
