import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";
import setBotComputer from "@/src/functions/backend/db/computers/set-bot-computer";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import setWorkspaceComputer from "@/src/functions/backend/db/workspaces/set-workspace-computer";
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
 * Switches the computer one of the session user's bots works on (in a
 * workspace, the workspace's default computer), and tells the user's
 * other tabs. Returns the bot's computers there, the new one first.
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

        const { bot_id, computer_id, workspace_id } = parseWithSchema({
            schema: SetBotComputerRequestSchema,
            data: body,
        });

        const { bot, computer, computers } = workspace_id
            ? {
                  bot: (await grabUserConversation({ user_id: user.id, bot_id, workspace_id })).bot,
                  ...(await setWorkspaceComputer({ user_id: user.id, workspace_id, computer_id })),
              }
            : await setBotComputer({
                  bot_id,
                  computer_id,
                  user_id: user.id,
              });

        await pushBotUpdated({ bot_id: bot.id || 0, computer_id: computer.id || null });

        await logEvent({
            title: "Bot computer switched",
            category: "system",
            user_id: user.id,
            plain_text: workspace_id
                ? `User #${user.id} made ${computer.name || `computer #${computer.id}`} the default of workspace #${workspace_id}.`
                : `User #${user.id} switched ${bot.name} to ${computer.name || `computer #${computer.id}`}.`,
            metadata: { bot_id: bot.id, computer_id: computer.id, workspace_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: workspace_id
                ? `${computer.name || "That computer"} is the workspace's default computer now.`
                : `${bot.name} is on ${computer.name || "that computer"} now.`,
            payload: computers,
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
