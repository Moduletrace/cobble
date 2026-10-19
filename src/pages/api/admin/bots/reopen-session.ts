import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import reopenBotSession from "@/src/functions/backend/db/bot-sessions/reopen-bot-session";
import { BotSessionIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Makes a closed session of one of the session user's conversations the
 * active one again, so the bot carries on from where it left off.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BUN_SQLITE_COBBLE_BOT_SESSIONS>
> = async ({ req, body }) => {
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

        const { session_id } = parseWithSchema({
            schema: BotSessionIdRequestSchema,
            data: body,
        });

        return {
            success: true,
            singleRes: await reopenBotSession({ session_id, user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
