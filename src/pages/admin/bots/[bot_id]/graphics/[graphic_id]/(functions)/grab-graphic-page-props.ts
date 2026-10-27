import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotGraphicView from "@/src/functions/backend/db/bot-graphics/grab-bot-graphic-view";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";

type Params = Parameters<BunextPageServerFn<PagePropsType>>[0];

/**
 * A graphic's page: the graphic, for the user it was made for. Anyone
 * else, or a missing graphic, lands on the bot's conversation (which
 * leads on to the bots when that isn't theirs either).
 */
export default async function grabGraphicPageProps(params: Params) {
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const bot_id = Number(params.query?.bot_id);
    const graphic_id = Number(params.query?.graphic_id);
    const graphic =
        Number.isInteger(graphic_id) && graphic_id > 0
            ? await grabBotGraphicView({ graphic_id, user_id: user.id }).catch(() => null)
            : null;

    if (!graphic) {
        return { redirect: { destination: bot_id ? `/admin/bots/${bot_id}` : AdminHomePath } };
    }

    return { props: { graphic } };
}
