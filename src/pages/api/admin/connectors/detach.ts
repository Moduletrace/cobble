import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import detachConnectorFromBot from "@/src/functions/backend/db/connectors/detach-connector-from-bot";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { DetachConnectorFromBotSchema } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Takes a connector off one bot for the user doing it: their own attachment
 * there, and their own account given to that bot alone. Shared reach is a
 * super admin's to change in Settings > Connectors.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req }) => {
    try {
        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const body = parseWithSchema({ schema: DetachConnectorFromBotSchema, data: await req.json() });

        await grabUserBot({ user_id: user.id, bot_id: body.bot_id });

        await detachConnectorFromBot({
            user_id: user.id,
            bot_id: body.bot_id,
            connector_id: body.connector_id,
        });

        await logEvent({
            title: "Connector taken off a bot",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} took connector #${body.connector_id} off bot #${body.bot_id}, for their own runs.`,
            metadata: { bot_id: body.bot_id, connector_id: body.connector_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: "Taken off this bot." };
    } catch (error: unknown) {
        if (error instanceof AppError) return { success: false, msg: error.message };

        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
