import type { BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotHookEvents from "@/src/functions/backend/db/bot-hooks/grab-bot-hook-events";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The latest calls to one of the session user's hooks (`?hook_id=`), each
 * payload cut to a preview.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const hook_id = Number(new URL(req.url).searchParams.get("hook_id")) || undefined;

        if (!hook_id) {
            return { success: false, msg: `Pick a hook.` };
        }

        return { success: true, payload: await grabBotHookEvents({ user_id: user.id, hook_id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
