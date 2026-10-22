import userAuth from "@/src/functions/backend/auth/user-auth";
import createBot from "@/src/functions/backend/db/bots/create-bot";
import addBotToWorkspace from "@/src/functions/backend/db/workspaces/add-bot-to-workspace";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { CreateBotRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Adds a worker bot to the session user's crew, and to one of their
 * workspaces when one is given. Returns the bot's id.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ bot_id: number }>> = async ({ req, body }) => {
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

        const { name, role, color, stone, system_prompt, workspace_id } = parseWithSchema({ schema: CreateBotRequestSchema, data: body });

        if (workspace_id && !(await grabUserWorkspace({ workspace_id, user_id: user.id }))?.id) {
            throw new AppError(`Workspace not found.`);
        }

        const bot_id = await createBot({ user_id: user.id, name, role, color, stone, system_prompt });

        if (workspace_id) {
            await addBotToWorkspace({ user_id: user.id, workspace_id, bot_id });
        }

        await logEvent({
            title: "Bot added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} added the bot ${name}.`,
            metadata: { bot_id, workspace_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${name} is on the crew.`, singleRes: { bot_id } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
