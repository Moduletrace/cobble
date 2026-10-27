import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabChatroomMessages from "@/src/functions/backend/db/chatrooms/grab-chatroom-messages";
import grabUserChatroom from "@/src/functions/backend/db/chatrooms/grab-user-chatroom";
import markChatroomRead from "@/src/functions/backend/db/chatrooms/mark-chatroom-read";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import chatroomHref from "@/src/utils/chatroom-href";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * One of the user's chatrooms asked from a bot's own chat (a workspace's
 * opens inside the workspace), read-only: the request, every bot's
 * messages in it and its outcome. Opening it marks it read.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const chatroom = await grabUserChatroom({ chatroom_id: Number(query.chatroom_id) || 0, user_id: user.id });

    if (!chatroom?.id) {
        return { redirect: { destination: "/admin/chatrooms" } };
    }

    /**
     * A workspace's room opens inside the workspace, with its rail.
     */
    if (chatroom.workspace_id) {
        return { redirect: { destination: chatroomHref({ chatroom }) } };
    }

    await markChatroomRead({ chatroom_id: chatroom.id, user_id: user.id });

    const [bots, workspaces, chatroom_messages] = await Promise.all([
        grabBots({ user_id: user.id }),
        grabUserWorkspaces({ user_id: user.id }),
        grabChatroomMessages({ chatroom_id: chatroom.id }),
    ]);

    return {
        props: {
            bots: railBots({ bots }),
            workspaces: railWorkspaces({ workspaces }),
            chatroom: { ...chatroom, unread: 0 },
            chatroom_messages,
        },
    };
};
