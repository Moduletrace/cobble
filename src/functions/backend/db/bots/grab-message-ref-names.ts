import type { MessageRefNames } from "@/src/utils/describe-message-refs";
import messageRefIds from "@/src/utils/message-ref-ids";
import grabUserWorkspace from "../workspaces/grab-user-workspace";
import grabUserBot from "./grab-user-bot";

type Params = {
    texts: string[];
    user_id: number | string;
};

/**
 * The names of the bots and workspaces some messages mention, only those
 * the user reaches (`grabUserBot`, `grabUserWorkspace`), so a ref to
 * anything else stays unnamed.
 */
export default async function grabMessageRefNames({ texts, user_id }: Params): Promise<MessageRefNames> {
    const { bot_ids, workspace_ids } = messageRefIds({ texts });
    const names: MessageRefNames = { bots: new Map(), workspaces: new Map() };

    for (const id of bot_ids) {
        const bot = await grabUserBot({ bot_id: id, user_id });

        if (bot?.name) names.bots.set(id, { name: bot.name, role: bot.role });
    }

    for (const id of workspace_ids) {
        const workspace = await grabUserWorkspace({ workspace_id: id, user_id });

        if (workspace?.name) names.workspaces.set(id, { name: workspace.name });
    }

    return names;
}
