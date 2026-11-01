import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBrowser from "@/src/functions/backend/db/browsers/grab-browser";
import listBrowserTools from "@/src/functions/backend/db/browsers/list-browser-tools";
import parseJsonColumn from "@/src/functions/backend/db/extensions/parse-json-column";
import { TestBrowserRequestSchema } from "@/src/schemas/browser-schema";
import type { McpServerTestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import { decrypt } from "@/src/utils/crypt";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Connects to a browser as the form has it, saved or not, and returns its
 * tools or why it didn't connect. Nothing is saved. Blank headers on a
 * saved browser test with the ones it has.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<McpServerTestPayload>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: TestBrowserRequestSchema, data: body });
        const saved = data.browser_id
            ? (await grabBrowser({ user_id: user.id, browser_id: data.browser_id })).headers
            : "";
        const headers = Object.keys(data.headers).length
            ? data.headers
            : parseJsonColumn<Record<string, string>>({
                  text: saved && !data.clear_headers ? await decrypt(saved) : "",
                  fallback: {},
              });

        try {
            const tools = await listBrowserTools({ url: data.url, headers });

            return {
                success: true,
                msg: `Connected: ${tools.length} ${tools.length == 1 ? "tool" : "tools"}.`,
                singleRes: { ok: true, tools },
            };
        } catch (error: unknown) {
            return {
                success: true,
                msg: `Couldn't connect.`,
                singleRes: {
                    ok: false,
                    tools: [],
                    error: (error instanceof Error ? error.message : String(error)).slice(0, 4000),
                },
            };
        }
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
