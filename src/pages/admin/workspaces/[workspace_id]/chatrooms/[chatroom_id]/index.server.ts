import withLastVisitedWorkspaceCookies from "@/src/functions/server/with-last-visited-workspace-cookies";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabChatroomMessages from "@/src/functions/backend/db/chatrooms/grab-chatroom-messages";
import grabUserChatroom from "@/src/functions/backend/db/chatrooms/grab-user-chatroom";
import markChatroomRead from "@/src/functions/backend/db/chatrooms/mark-chatroom-read";
import grabWorkspaceRailProps from "@/src/functions/backend/db/workspaces/grab-workspace-rail-props";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import chatroomHref from "@/src/utils/chatroom-href";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * One of the user's chatrooms asked in this workspace, read-only, beside
 * the workspace's rail. A room from elsewhere opens where it belongs.
 * Opening it marks it read.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const chatroom = await grabUserChatroom({ chatroom_id: Number(query.chatroom_id) || 0, user_id: user.id });

    if (!chatroom?.id) {
        return { redirect: { destination: `/admin/workspaces/${query.workspace_id}/chatrooms` } };
    }

    if (String(chatroom.workspace_id || "") != String(query.workspace_id)) {
        return { redirect: { destination: chatroomHref({ chatroom }) } };
    }

    const rail = await grabWorkspaceRailProps({ user_id: user.id, workspace_id: chatroom.workspace_id! });

    if (!rail) {
        return { redirect: { destination: "/admin/chatrooms" } };
    }

    await markChatroomRead({ chatroom_id: chatroom.id, user_id: user.id });

    return {
        props: {
            ...rail,
            chatroom: { ...chatroom, unread: 0 },
            chatroom_messages: await grabChatroomMessages({ chatroom_id: chatroom.id }),
        },
        res_transform(res) {
            return withLastVisitedWorkspaceCookies({ req: params.req, res, workspace_id: Number(rail.workspace.id) });
        },
    };
};
