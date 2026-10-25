import userAuth from "@/src/functions/backend/auth/user-auth";
import updateBotHook from "@/src/functions/backend/db/bot-hooks/update-bot-hook";
import type { BotHookSignatureFormat } from "@/src/dict/bot-hook-dict";
import { UpdateBotHookRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { BotHookWithNames } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Changes one of the session user's hooks: its name, brief, whether it's on, or how its calls are signed. Returns the hook.
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

        const { hook_id, signature_format, ...data } = parseWithSchema({ schema: UpdateBotHookRequestSchema, data: body });

        const hook = await updateBotHook({
            user_id: user.id,
            hook_id,
            data: { ...data, signature_format: signature_format as BotHookSignatureFormat | undefined },
        });

        return {
            success: true,
            singleRes: hook,
            msg: data.enabled === undefined ? `Saved.` : data.enabled ? `${hook.title} is back on.` : `${hook.title} is paused.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
