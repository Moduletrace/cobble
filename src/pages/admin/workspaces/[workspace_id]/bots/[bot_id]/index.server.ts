import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationProps from "@/src/functions/backend/db/bot-sessions/grab-conversation-props";
import withLastVisitedBotCookies from "@/src/functions/server/with-last-visited-bot-cookies";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A bot's conversation inside a workspace: the bot works with the
 * workspace's context, computers and models. Only the coordinator and the
 * workspace's bots have one; anyone else goes back to the workspace
 * settings (managers) or their bots. Rendering it records the conversation
 * in the last-visited cookies, so `/admin/bots` opens it again.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user, user_types } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const props = await grabConversationProps({
        user_id: Number(user.id),
        bot_id: String(query.bot_id),
        workspace_id: String(query.workspace_id),
    });

    if (!props?.bot?.id) {
        return {
            redirect: {
                destination: canManageCrew({ user_types })
                    ? `/admin/settings/workspaces/${query.workspace_id}`
                    : `/admin/workspaces/${query.workspace_id}`,
            },
        };
    }

    const bot_id = props.bot.id;
    const workspace_id = props.workspace?.id ?? query.workspace_id;

    return {
        props,
        res_transform(res) {
            return withLastVisitedBotCookies({ req: params.req, res, bot_id, workspace_id });
        },
    };
};
