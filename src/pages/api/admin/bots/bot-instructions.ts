import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotUserMemory from "@/src/functions/backend/db/bots/grab-bot-user-memory";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import { BotIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * A bot's core instructions for its panel in the conversation, which loads
 * them when it opens (page props leave them out), plus what it remembers about
 * the user reading it. Any user who reaches the bot reads its instructions and
 * their own memory; its core memory stays with super admins and admins, and
 * only the super admin reaches the coordinator.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<{ system_prompt: string; memory: string; user_memory: string }>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const may_read_core = canManageCrew({ user_types });

        const { bot_id } = parseWithSchema({ schema: BotIdRequestSchema, data: body });
        const bot = await grabUserBot({ bot_id, user_id: user.id });

        if (!bot?.id) {
            throw new AppError(`Bot not found.`);
        }

        return {
            success: true,
            singleRes: {
                system_prompt: bot.system_prompt || "",
                memory: may_read_core ? bot.memory || "" : "",
                user_memory: (await grabBotUserMemory({ bot_id: bot.id, user_id: user.id })) || "",
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
