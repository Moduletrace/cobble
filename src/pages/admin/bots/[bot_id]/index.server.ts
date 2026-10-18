import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import markBotRead from "@/src/functions/backend/db/bots/mark-bot-read";
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

    const bots = await grabBots({ user_id: user.id });
    const bot = bots.find((b) => String(b.id) === String(query.bot_id));

    if (!bot?.id) {
        return {
            redirect: {
                destination: "/admin/bots",
            },
        };
    }

    if (bot.unread) {
        await markBotRead({ bot_id: bot.id, user_id: user.id });
        bot.unread = 0;
    }

    const [bot_messages, bot_task] = await Promise.all([
        grabBotMessages({ bot_id: bot.id }),
        grabActiveBotTask({ bot_id: bot.id }),
    ]);

    return {
        props: {
            bots,
            bot,
            bot_messages,
            bot_task,
        },
    };
};
