import userAuth from "@/src/functions/backend/auth/user-auth";
import rotateBotHookToken from "@/src/functions/backend/db/bot-hooks/rotate-bot-hook-token";
import { BotHookIdRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { BotHookWithToken } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Gives one of the session user's hooks a new URL; the old one stops working at once. Returns the hook and its new token, shown this once.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotHookWithToken>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { hook_id } = parseWithSchema({ schema: BotHookIdRequestSchema, data: body });

        return {
            success: true,
            singleRes: await rotateBotHookToken({ user_id: user.id, hook_id }),
            msg: `New URL made. The old one no longer works.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
