import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserChatrooms from "@/src/functions/backend/db/chatrooms/grab-user-chatrooms";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { PagePropsType } from "@/src/types";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Every chatroom of the user's, open ones first, beside the crew rail.
 */
export const server: BunextPageServerFn<PagePropsType> = async ({ req }) => {
    const { user } = await userAuth({ req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const [bots, workspaces, chatrooms] = await Promise.all([
        grabBots({ user_id: user.id }),
        grabUserWorkspaces({ user_id: user.id }),
        grabUserChatrooms({ user_id: user.id }),
    ]);

    return {
        props: {
            bots: railBots({ bots }),
            workspaces: railWorkspaces({ workspaces }),
            chatrooms,
        },
    };
};
