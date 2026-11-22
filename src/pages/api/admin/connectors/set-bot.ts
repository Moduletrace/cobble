import userAuth from "@/src/functions/backend/auth/user-auth";
import setBotConnector from "@/src/functions/backend/db/connectors/set-bot-connector";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SetBotConnectorRequestSchema } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

type Payload = {
    connector_id: number;
    attached: boolean;
};

/**
 * Attaches a connector to one bot for the user doing it: it shows in their
 * runs there and nobody else's. Shared reach is a super admin's workspace or
 * global connector.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<Payload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { bot_id, connector_id, attached } = parseWithSchema({
            schema: SetBotConnectorRequestSchema,
            data: body,
        });

        const { bot, connector } = await setBotConnector({
            user_id: user.id,
            bot_id,
            connector_id,
            attached,
        });

        await logEvent({
            title: attached ? "Connector added to a bot" : "Connector removed from a bot",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${attached ? "gave" : "took"} the connector ${connector.name} ${attached ? "to" : "from"} ${bot.name} (#${bot.id}), for their own runs.`,
            metadata: { bot_id: bot.id, connector_id: connector.id, attached },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: attached ? `Added ${connector.name} to your runs on ${bot.name}.` : `Removed ${connector.name}.`,
            singleRes: { connector_id: connector.id, attached },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
