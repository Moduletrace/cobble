import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    /**
     * The workspace the bot is working in: then its computers are the
     * workspace's, the default first, and nothing else.
     */
    workspace_id?: number | string | null;
    /**
     * In its own chat, whether the computers of the workspaces it's
     * attached to count too (they do by default). The `assign_computer`
     * tool's view of direct access turns them off.
     */
    include_workspace_computers?: boolean;
};

/**
 * Every computer a bot can use where it's working. In a workspace, the
 * workspace's computers (none linked: none at all), its default first. In
 * its own chat, the ones it was given directly (`bot_computers`) and those
 * of the workspaces it's attached to, since a workspace's computer is
 * every bit its own; the coordinator can use all of them. There the one it
 * works on now (`bots.computer_id`) comes first, else the main one, so
 * `computers[0]` is where its tasks run by default. The same for every
 * user it works for: callers check the user reaches the bot.
 */
export default async function grabBotComputers({
    bot_id,
    workspace_id,
    include_workspace_computers = true,
}: Params): Promise<BUN_SQLITE_COBBLE_COMPUTERS[]> {
    if (workspace_id) {
        const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
            sql: `SELECT c.* FROM computers c
                JOIN workspace_computers wc ON wc.computer_id = c.id AND wc.workspace_id = ?
                JOIN workspaces w ON w.id = wc.workspace_id AND w.archived = 0
                WHERE (
                    (SELECT kind FROM bots WHERE id = ?) = 'coordinator'
                    OR ? IN (SELECT bot_id FROM workspace_bots WHERE workspace_id = w.id)
                )
                ORDER BY c.id = w.computer_id DESC, wc.id ASC`,
            values: [workspace_id, bot_id, Number(bot_id)],
        });

        return res.payload || [];
    }

    const workspace_computers_sql = include_workspace_computers
        ? `OR c.id IN (
                SELECT wc.computer_id FROM workspace_computers wc
                JOIN workspaces w ON w.id = wc.workspace_id AND w.archived = 0
                JOIN workspace_bots wb ON wb.workspace_id = w.id AND wb.bot_id = ?
            )`
        : "";

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
        sql: `SELECT c.* FROM computers c
            WHERE (
                (SELECT kind FROM bots WHERE id = ?) = 'coordinator'
                OR c.id IN (SELECT computer_id FROM bot_computers WHERE bot_id = ?)
                ${workspace_computers_sql}
            )
            ORDER BY c.id = (SELECT computer_id FROM bots WHERE id = ?) DESC,
                c.kind = 'main' DESC, c.id ASC`,
        values: include_workspace_computers
            ? [bot_id, bot_id, bot_id, bot_id]
            : [bot_id, bot_id, bot_id],
    });

    return res.payload || [];
}
