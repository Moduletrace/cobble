import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import updateBot from "@/src/functions/backend/db/bots/update-bot";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UpdateBotRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves one of the session user's bots (name, job, hue, instructions).
 * Returns the bot.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_BOTS>> = async ({ req, body }) => {
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

        const { bot_id, name, role, hue, system_prompt } = parseWithSchema({
            schema: UpdateBotRequestSchema,
            data: body,
        });

        const bot = await updateBot({ user_id: user.id, bot_id, name, role, hue, system_prompt });

        await logEvent({
            title: "Bot changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed the bot ${bot.name}.`,
            metadata: { bot_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved.`, singleRes: bot };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
