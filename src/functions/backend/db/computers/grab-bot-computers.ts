import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * Every computer a bot can use: the ones it was given directly
 * (`bot_computers`) plus the ones assigned to any workspace it's in
 * (`workspace_computers`); the coordinator can use all of them. Only the
 * owner's computers, each once. The
 * one it works on now (`bots.computer_id`) comes first, else its main one,
 * so `computers[0]` is where its tasks run by default.
 */
export default async function grabBotComputers({
    bot_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_COMPUTERS[]> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
        sql: `SELECT c.* FROM computers c
            WHERE c.user_id = ?
            AND (
                (SELECT kind FROM bots WHERE id = ? AND user_id = c.user_id) = 'coordinator'
                OR c.id IN (SELECT computer_id FROM bot_computers WHERE bot_id = ?)
                OR c.id IN (
                    SELECT wc.computer_id FROM workspace_computers wc
                    JOIN workspace_bots wb ON wb.workspace_id = wc.workspace_id
                    JOIN workspaces w ON w.id = wc.workspace_id
                    WHERE wb.bot_id = ? AND w.archived = 0
                )
            )
            ORDER BY c.id = (SELECT computer_id FROM bots WHERE id = ?) DESC,
                c.kind = 'main' DESC, c.id ASC`,
        values: [user_id, bot_id, bot_id, bot_id, bot_id],
    });

    return res.payload || [];
}
