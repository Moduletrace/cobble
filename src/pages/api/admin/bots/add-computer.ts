import userAuth from "@/src/functions/backend/auth/user-auth";
import addBotToComputer from "@/src/functions/backend/db/computers/add-bot-to-computer";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotComputerRequestSchema } from "@/src/schemas/bot-schema";
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
 * Gives one of the session user's bots direct access to one of their
 * computers. Returns the bot's computers.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
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
            throw new AppError(`Only an admin can do that.`);
        }

        const { bot_id, computer_id } = parseWithSchema({
            schema: BotComputerRequestSchema,
            data: body,
        });

        await addBotToComputer({ user_id: user.id, bot_id, computer_id });

        await logEvent({
            title: "Bot computer access changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} gave bot #${bot_id} access to computer #${computer_id}.`,
            metadata: { bot_id, computer_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved.`,
            payload: await grabBotComputers({ bot_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
