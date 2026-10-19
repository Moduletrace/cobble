import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteBot from "@/src/functions/backend/db/bots/delete-bot";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes one of the session user's worker bots and everything it had
 * (conversations, tasks, models). The coordinator stays.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
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

        const { bot_id } = parseWithSchema({ schema: BotIdRequestSchema, data: body });

        const bot = await deleteBot({ user_id: user.id, bot_id });

        await logEvent({
            title: "Bot deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the bot ${bot.name}.`,
            metadata: { bot_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${bot.name || "The bot"} is deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
