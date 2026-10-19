import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationProps from "@/src/functions/backend/db/bot-sessions/grab-conversation-props";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return {
            redirect: {
                destination: "/auth/login",
            },
        };
    }

    const props = await grabConversationProps({
        user_id: Number(user.id),
        bot_id: String(query.bot_id),
    });

    if (!props) {
        return {
            redirect: {
                destination: "/admin/bots",
            },
        };
    }

    return { props };
};
