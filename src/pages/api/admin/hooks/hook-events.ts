import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotHookEvents from "@/src/functions/backend/db/bot-hooks/grab-bot-hook-events";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";
import { SearchHookCallsRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { BotHookCall } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Calls to the session user's hooks, newest first: one hook's
 * (`?hook_id=`) or all, found by words in what they sent or what their run
 * answered (`?q=`), one status (`?status=`), older than a call
 * (`?before_id=`). Payloads and responses are previews.
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

        const params = Object.fromEntries(
            [...new URL(req.url).searchParams.entries()].filter(([, value]) => value != ""),
        );

        const { hook_id, q, status, before_id, limit } = parseWithSchema({
            schema: SearchHookCallsRequestSchema,
            data: params,
        });

        return {
            success: true,
            payload: await grabBotHookEvents({
                user_id: user.id,
                hook_id,
                query: q,
                status: status as BotHookEventStatus | undefined,
                before_id,
                limit,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
