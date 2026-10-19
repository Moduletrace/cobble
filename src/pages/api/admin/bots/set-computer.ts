import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import setBotComputer from "@/src/functions/backend/db/computers/set-bot-computer";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SetBotComputerRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Switches the computer one of the session user's bots works on, and
 * tells the user's other tabs. Returns the bot's computers, the new one
 * first.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BUN_SQLITE_COBBLE_COMPUTERS>
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

        const { bot_id, computer_id } = parseWithSchema({
            schema: SetBotComputerRequestSchema,
            data: body,
        });

        const { bot, computer, computers } = await setBotComputer({
            bot_id,
            computer_id,
            user_id: user.id,
        });

        await pushBotNotice({
            bot_id: bot.id || 0,
            bot: {
                id: bot.id,
                face: bot.face,
                status_line: bot.status_line,
                computer_id: computer.id,
            },
        });

        await logEvent({
            title: "Bot computer switched",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} switched ${bot.name} to ${computer.name || `computer #${computer.id}`}.`,
            metadata: { bot_id: bot.id, computer_id: computer.id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `${bot.name} is on ${computer.name || "that computer"} now.`,
            payload: computers,
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
