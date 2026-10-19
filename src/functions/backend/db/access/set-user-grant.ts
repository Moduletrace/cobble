import BunSQLite from "@moduletrace/bun-sqlite";
import type { UserGrantKind } from "@/src/schemas/user-schema";

type Params = {
    user_id: number | string;
    /**
     * A worker assigned to them (`bot_users`, for their own chat) or a
     * workspace they're in (`workspace_users`).
     */
    kind: UserGrantKind;
    id: number;
    /**
     * Gives it when true, takes it away when false.
     */
    granted: boolean;
};

/**
 * Gives a user one worker or workspace, or takes it away. The caller
 * checks the actor manages the crew. An id that isn't a worker (the
 * coordinator is never assigned) or a workspace is skipped.
 */
export default async function setUserGrant({ user_id, kind, id, granted }: Params) {
    const table = kind == "bot" ? "bot_users" : "workspace_users";
    const column = kind == "bot" ? "bot_id" : "workspace_id";

    if (!granted) {
        await BunSQLite.sql({ sql: `DELETE FROM ${table} WHERE user_id = ? AND ${column} = ?`, values: [user_id, id] });
        return;
    }

    const now = Date.now();
    const source = kind == "bot" ? `bots WHERE id = ? AND kind = 'worker'` : `workspaces WHERE id = ?`;

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO ${table} (created_at, updated_at, ${column}, user_id)
            SELECT ?, ?, id, ? FROM ${source}`,
        values: [now, now, user_id, id],
    });
}
