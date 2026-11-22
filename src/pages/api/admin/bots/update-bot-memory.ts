import userAuth from "@/src/functions/backend/auth/user-auth";
import updateBotMemory from "@/src/functions/backend/db/bots/update-bot-memory";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { UpdateBotMemoryRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Replaces a bot's core memory from its panel (the memory tab), for super
 * admins and admins. Its memory of each user and its memory in a workspace
 * are separate rows.
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

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can edit a bot.`);
        }

        const { bot_id, memory } = parseWithSchema({
            schema: UpdateBotMemoryRequestSchema,
            data: body,
        });

        await updateBotMemory({ user_id: user.id, bot_id, memory });

        await logEvent({
            title: "Bot memory changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} edited bot #${bot_id}'s memory.`,
            metadata: { bot_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};