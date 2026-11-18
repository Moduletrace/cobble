import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationProps from "@/src/functions/backend/db/bot-sessions/grab-conversation-props";
import withLastVisitedBotCookies from "@/src/functions/server/with-last-visited-bot-cookies";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A bot's own chat. Rendering it records the conversation in the
 * last-visited cookies, so `/admin/bots` opens it again.
 */
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

    if (!props?.bot?.id) {
        return {
            redirect: {
                destination: "/admin/bots",
            },
        };
    }

    const bot_id = props.bot.id;

    return {
        props,
        res_transform(res) {
            return withLastVisitedBotCookies({ req: params.req, res, bot_id });
        },
    };
};
