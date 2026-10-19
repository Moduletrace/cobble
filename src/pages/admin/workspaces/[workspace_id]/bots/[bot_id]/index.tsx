import type { PagePropsType } from "@/src/types";
import type { BunextPageModuleMetaFn } from "@moduletrace/bunext/types";
import { SiteData } from "@/src/data/site-data";
import Conversation from "@/src/pages/admin/bots/[bot_id]/(sections)/conversation";

/**
 * A bot's conversation in a workspace: the same conversation as
 * `/admin/bots/[bot_id]`, scoped by `pageProps.workspace`.
 */
export default function WorkspaceBotConversationPage() {
    return <Conversation />;
}

export const meta: BunextPageModuleMetaFn = async (params) => {
    const props = params.serverRes?.props as PagePropsType | undefined;
    const bot = props?.bot;

    return {
        title: `${bot?.name || "Bots"} · ${props?.workspace?.name || "Workspace"} | ${SiteData["SiteName"]}`,
        description: bot?.role || `Your crew of bots.`,
    };
};
