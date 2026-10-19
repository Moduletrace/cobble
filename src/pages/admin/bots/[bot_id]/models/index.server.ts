import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * A worker bot's model settings. The coordinator always uses the defaults,
 * so its page goes back to its conversation.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query: PageQueryObject = params.query;
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const bots = await grabBots({ user_id: user.id });
    const bot = bots.find((b) => String(b.id) === String(query.bot_id));

    if (!bot?.id) {
        return { redirect: { destination: "/admin/bots" } };
    }

    if (bot.kind == "coordinator") {
        return { redirect: { destination: `/admin/bots/${bot.id}` } };
    }

    return {
        props: {
            bots,
            bot,
            workspaces: await grabUserWorkspaces({ user_id: user.id }),
            bot_harness_overview: await grabBotHarnessOverview({ bot_id: bot.id }),
        },
    };
};
