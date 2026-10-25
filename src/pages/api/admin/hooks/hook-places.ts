import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHookPlaces from "@/src/functions/backend/db/bot-hooks/grab-hook-places";
import { HookPlacesRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { HookPlace } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Where the session user can give a bot a hook: its own chat and its workspaces they're in.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HookPlace>> = async ({ req, body }) => {
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

        const { bot_id } = parseWithSchema({ schema: HookPlacesRequestSchema, data: body });

        return { success: true, payload: await grabHookPlaces({ user_id: user.id, bot_id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
