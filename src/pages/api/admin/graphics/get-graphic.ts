import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotGraphicView from "@/src/functions/backend/db/bot-graphics/grab-bot-graphic-view";
import { BotGraphicIdSchema } from "@/src/schemas/bot-graphic-schema";
import type { BotGraphicView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?graphic_id=`: a graphic a bot made for the session user, as its
 * card names it. Never the HTML (`/graphics/<id>` serves that, sandboxed),
 * and nobody else reads it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotGraphicView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { graphic_id } = parseWithSchema({ schema: BotGraphicIdSchema, data: query });
        const view = await grabBotGraphicView({ graphic_id, user_id: user.id });

        if (!view) throw new AppError(`This graphic isn't available.`);

        return { success: true, singleRes: view };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
