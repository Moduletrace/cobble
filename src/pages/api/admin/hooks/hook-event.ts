import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotHookEvent from "@/src/functions/backend/db/bot-hooks/grab-bot-hook-event";
import { HookCallIdRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { BotHookCall } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One call to one of the session user's hooks (`?event_id=`), whole: what
 * it sent and what its run answered.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotHookCall>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { event_id } = parseWithSchema({
            schema: HookCallIdRequestSchema,
            data: { event_id: new URL(req.url).searchParams.get("event_id") },
        });

        return { success: true, singleRes: await grabBotHookEvent({ user_id: user.id, event_id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
