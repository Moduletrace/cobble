import type { LastConversation } from "@/src/types";
import conversationHref from "@/src/utils/conversation-href";
import readLastVisitedBot from "@/src/utils/read-last-visited-bot";
import grabUserConversation, { type UserConversation } from "./grab-user-conversation";

type Params = {
    user_id: number | string;
    req: Request;
};

/**
 * The conversation the last-visited cookie names, for the rail's way back
 * on settings and the rail pages, only while the user still reaches it
 * (`grabUserConversation`, the conversation pages' own check). A workspace
 * conversation the user lost falls back to the bot's own chat; with
 * neither, null and the rail shows no way back.
 */
export default async function grabLastConversation({
    user_id,
    req,
}: Params): Promise<LastConversation | null> {
    const visited = readLastVisitedBot({ req });

    if (!visited) return null;

    const reach = ({ workspace_id }: { workspace_id: number | null }) =>
        grabUserConversation({ user_id, bot_id: visited.bot_id, workspace_id }).catch(
            () => null,
        );

    const conversation: UserConversation | null =
        (visited.workspace_id ? await reach({ workspace_id: visited.workspace_id }) : null) ||
        (await reach({ workspace_id: null }));

    if (!conversation) return null;

    const { bot, workspace } = conversation;

    return {
        href: conversationHref({ bot_id: bot.id, workspace_id: workspace?.id }),
        bot: {
            id: bot.id,
            name: bot.name || `Bot ${bot.id}`,
            kind: bot.kind || null,
            color: bot.color || null,
            stone: bot.stone || null,
            hue: bot.hue || null,
            image_media_id: bot.image_media_id || null,
        },
        workspace: workspace?.id
            ? { id: workspace.id, name: workspace.name || `Workspace ${workspace.id}` }
            : null,
    };
}
