import userAuth from "@/src/functions/backend/auth/user-auth";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import grabUserBotHook from "@/src/functions/backend/db/bot-hooks/grab-user-bot-hook";
import syncHookRunners from "@/src/functions/backend/db/bot-hooks/sync-hook-runners";
import type { BotHookWithNames } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { BotHookIdRequestSchema } from "@/src/schemas/bot-hook-schema";

/**
 * Stops and starts one of the crew's hooks' runners: what a crew manager
 * does when a bridge is up but not answering, or after they changed
 * something on the computer it needs. A crew manager only, like setting
 * one. Returns the hook as it is afterwards (its runner, once the check
 * has run).
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotHookWithNames>> = async ({ req, body }) => {
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

        await assertCrewManager({ user_id: user.id });

        const { hook_id } = parseWithSchema({ schema: BotHookIdRequestSchema, data: body });

        const hook = await grabUserBotHook({ user_id: user.id, hook_id });

        if (!hook.runner_command) {
            throw new AppError(`"${hook.title || `Hook ${hook.id}`}" has no runner to restart.`);
        }

        const sync = await syncHookRunners({ computer_id: hook.runner_computer_id || hook.computer_id, restart_hook_id: hook.id });

        if (!sync.ok) throw new AppError(sync.error || `The check couldn't run.`);

        return {
            success: true,
            singleRes: await grabUserBotHook({ user_id: user.id, hook_id }),
            msg: sync.running ? `"${hook.title}" is running again.` : `"${hook.title}" still isn't running.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};