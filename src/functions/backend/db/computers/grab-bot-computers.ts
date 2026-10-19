import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    /**
     * The workspace the bot is working in: then its computers are the
     * workspace's, the default first, and nothing else.
     */
    workspace_id?: number | string | null;
};

/**
 * Every computer a bot can use where it's working. In a workspace, the
 * workspace's computers (none linked: none at all), its default first. In
 * its own chat, the ones it was given directly (`bot_computers`); the
 * coordinator can use all of the owner's. There the one it works on now
 * (`bots.computer_id`) comes first, else its main one, so `computers[0]`
 * is where its tasks run by default.
 */
export default async function grabBotComputers({
    bot_id,
    user_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_COMPUTERS[]> {
    if (workspace_id) {
        const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
            sql: `SELECT c.* FROM computers c
                JOIN workspace_computers wc ON wc.computer_id = c.id AND wc.workspace_id = ?
                JOIN workspaces w ON w.id = wc.workspace_id AND w.user_id = c.user_id AND w.archived = 0
                WHERE c.user_id = ?
                AND (
                    (SELECT kind FROM bots WHERE id = ? AND user_id = c.user_id) = 'coordinator'
                    OR ? IN (SELECT bot_id FROM workspace_bots WHERE workspace_id = w.id)
                )
                ORDER BY c.id = w.computer_id DESC, wc.id ASC`,
            values: [workspace_id, user_id, bot_id, Number(bot_id)],
        });

        return res.payload || [];
    }

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
        sql: `SELECT c.* FROM computers c
            WHERE c.user_id = ?
            AND (
                (SELECT kind FROM bots WHERE id = ? AND user_id = c.user_id) = 'coordinator'
                OR c.id IN (SELECT computer_id FROM bot_computers WHERE bot_id = ?)
            )
            ORDER BY c.id = (SELECT computer_id FROM bots WHERE id = ?) DESC,
                c.kind = 'main' DESC, c.id ASC`,
        values: [user_id, bot_id, bot_id, bot_id],
    });

    return res.payload || [];
}
