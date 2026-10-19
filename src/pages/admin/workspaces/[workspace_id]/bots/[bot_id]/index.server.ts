import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationProps from "@/src/functions/backend/db/bot-sessions/grab-conversation-props";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A bot's conversation inside a workspace: the bot works with the
 * workspace's context, computers and models. Only the coordinator and the
 * workspace's bots have one; anyone else goes back to the workspace.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const props = await grabConversationProps({
        user_id: Number(user.id),
        bot_id: String(query.bot_id),
        workspace_id: String(query.workspace_id),
    });

    if (!props) {
        return { redirect: { destination: `/admin/workspaces/${query.workspace_id}` } };
    }

    return { props };
};
