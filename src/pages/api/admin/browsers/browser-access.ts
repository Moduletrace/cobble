import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBrowserAccess from "@/src/functions/backend/db/browsers/grab-browser-access";
import saveBrowserAccess from "@/src/functions/backend/db/browsers/save-browser-access";
import { BrowserAccessScopeSchema, SaveBrowserAccessRequestSchema } from "@/src/schemas/browser-schema";
import type { BrowserAccessPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The session user's browser picks for one scope (a bot, a workspace, or
 * all their bots): POST with `save` to replace them, either way answering
 * with what's now set. Only ever their own browsers.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BrowserAccessPayload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const scope = parseWithSchema({ schema: BrowserAccessScopeSchema, data: body });

        if ((body as { save?: boolean } | undefined)?.save) {
            if (isReadOnlyUser({ user_types: user_types || [] })) {
                throw new AppError(`This user can only read records.`);
            }

            await saveBrowserAccess({
                user_id: user.id,
                data: parseWithSchema({ schema: SaveBrowserAccessRequestSchema, data: body }),
            });
        }

        return { success: true, singleRes: await grabBrowserAccess({ user_id: user.id, ...scope }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
