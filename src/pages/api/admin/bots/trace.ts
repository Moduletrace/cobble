import userAuth from "@/src/functions/backend/auth/user-auth";
import grabTraceSession from "@/src/functions/backend/db/bot-sessions/grab-trace-session";
import grabSessionTraces from "@/src/functions/backend/db/bots-queue/grab-session-traces";
import { BotSessionIdRequestSchema } from "@/src/schemas/bot-schema";
import type { BotTraceJob } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The debug view's trace of a session: the runs that kept one, newest
 * first, each with every turn, tool call and event it recorded. The
 * conversation's own user reads it, and a super admin (who reaches the
 * crew anyway) reads any.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotTraceJob[]>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { session_id } = parseWithSchema({ schema: BotSessionIdRequestSchema, data: body });

        const session = await grabTraceSession({ session_id, user_id: user.id, user_types });

        if (!session?.id) throw new AppError(`Session not found.`);

        return { success: true, singleRes: await grabSessionTraces({ session_id: session.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};