import userAuth from "@/src/functions/backend/auth/user-auth";
import createBotHook from "@/src/functions/backend/db/bot-hooks/create-bot-hook";
import type { BotHookSignatureFormat, BotHookSource } from "@/src/dict/bot-hook-dict";
import { CreateBotHookRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { BotHookWithToken } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Gives a bot the session user can chat with a hook: a secret URL whose calls queue its brief as a task. Returns the hook and its token, shown this once.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotHookWithToken>> = async ({ req, body }) => {
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

        const { bot_id, workspace_id, signature_format, source, ...rest } = parseWithSchema({
            schema: CreateBotHookRequestSchema,
            data: body,
        });

        const created = await createBotHook({
            user_id: user.id,
            bot_id,
            workspace_id: workspace_id || null,
            signature_format: signature_format as BotHookSignatureFormat | undefined,
            source: source as BotHookSource | undefined,
            ...rest,
        });

        return {
            success: true,
            singleRes: created,
            msg: created.token
                ? `Hook made. Copy its URL now: it is shown only once.`
                : created.watch?.ok
                  ? `Hook made. It gets this computer's browser notifications.`
                  : `Hook made, but the computer's watcher isn't running yet: ${created.watch?.error || "unknown error"}`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
