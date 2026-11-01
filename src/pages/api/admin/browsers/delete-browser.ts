import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteBrowser from "@/src/functions/backend/db/browsers/delete-browser";
import grabBrowsers from "@/src/functions/backend/db/browsers/grab-browsers";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BrowserIdSchema } from "@/src/schemas/browser-schema";
import type { BrowserRecord } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Removes one of the session user's own browsers. Answers with their fresh
 * list.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BrowserRecord[]>> = async ({ req, body }) => {
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

        const { browser_id } = parseWithSchema({ schema: BrowserIdSchema, data: body });
        const browser = await deleteBrowser({ user_id: user.id, browser_id });

        await logEvent({
            title: "Browser removed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} removed their browser ${browser.name}.`,
            metadata: { browser_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Removed ${browser.name}.`, singleRes: await grabBrowsers({ user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
