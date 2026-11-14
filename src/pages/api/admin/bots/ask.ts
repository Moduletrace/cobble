import BunSQLite from "@moduletrace/bun-sqlite";
import userAuth from "@/src/functions/backend/auth/user-auth";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { AskOverview } from "@/src/types";

/**
 * One crew request, for its `[ask:ID]` pill and the bar in the session it
 * opened: which bot worked it, where, and the session before it. Read by
 * the user whose request it is (`?ask_id=` or `?session_id=`).
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<AskOverview>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const url = new URL(req.url);
        const ask_id = Number(url.searchParams.get("ask_id")) || 0;
        const session_id = Number(url.searchParams.get("session_id")) || 0;

        if (!ask_id && !session_id) throw new AppError(`Nothing to read.`);

        const [row] = (await BunSQLite.sql({
            sql: ask_id
                ? `SELECT a.id, a.title, a.status, a.target_bot_id, a.workspace_id, a.session_id,
                          a.previous_session_id, b.name AS requester_name, t.name AS target_name
                   FROM bot_asks a
                   LEFT JOIN bots b ON b.id = a.requester_bot_id
                   LEFT JOIN bots t ON t.id = a.target_bot_id
                   WHERE a.id = ? AND a.user_id = ? LIMIT 1`
                : `SELECT a.id, a.title, a.status, a.target_bot_id, a.workspace_id, a.session_id,
                          a.previous_session_id, b.name AS requester_name, t.name AS target_name
                   FROM bot_asks a
                   LEFT JOIN bots b ON b.id = a.requester_bot_id
                   LEFT JOIN bots t ON t.id = a.target_bot_id
                   WHERE a.session_id = ? AND a.user_id = ? LIMIT 1`,
            values: [ask_id || session_id, Number(user.id)],
        })).payload || [];

        if (!row) throw new AppError(`That request isn't there.`);

        return {
            success: true,
            singleRes: {
                ask_id: Number(row.id),
                title: row.title ? String(row.title) : null,
                status: String(row.status),
                target_bot_id: row.target_bot_id ? Number(row.target_bot_id) : null,
                target_name: row.target_name ? String(row.target_name) : null,
                workspace_id: row.workspace_id ? Number(row.workspace_id) : null,
                session_id: row.session_id ? Number(row.session_id) : null,
                previous_session_id: row.previous_session_id ? Number(row.previous_session_id) : null,
                requester_name: row.requester_name ? String(row.requester_name) : null,
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
