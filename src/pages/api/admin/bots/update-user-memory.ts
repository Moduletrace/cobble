import userAuth from "@/src/functions/backend/auth/user-auth";
import updateBotUserMemory from "@/src/functions/backend/db/bots/update-bot-user-memory";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UpdateBotMemoryRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Replaces what a bot remembers about the user reading its panel ("About
 * you"). The memory is their own, so any user who reaches the bot may rewrite
 * it; its core memory and its memory of everyone else stay with admins.
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

        const { bot_id, memory } = parseWithSchema({
            schema: UpdateBotMemoryRequestSchema,
            data: body,
        });

        await updateBotUserMemory({ user_id: user.id, bot_id, memory });

        await logEvent({
            title: "Bot memory about a user changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} edited bot #${bot_id}'s memory about them.`,
            metadata: { bot_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};