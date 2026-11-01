import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBrowsers from "@/src/functions/backend/db/browsers/grab-browsers";
import saveBrowser from "@/src/functions/backend/db/browsers/save-browser";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveBrowserRequestSchema } from "@/src/schemas/browser-schema";
import type { BrowserRecord } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Adds or edits one of the session user's own browsers. Answers with their
 * fresh list.
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

        const data = parseWithSchema({ schema: SaveBrowserRequestSchema, data: body });
        const browser_id = await saveBrowser({ user_id: user.id, data });

        await logEvent({
            title: data.browser_id ? "Browser changed" : "Browser added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} saved their browser ${data.name}.`,
            metadata: { browser_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved ${data.name}.`, singleRes: await grabBrowsers({ user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
