import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The bot whose file it is, or the bot the search ran for.
     */
    bot_id?: number | string | null;
    /**
     * The workspace whose file it is, when it shares one.
     */
    workspace_id?: number | string | null;
};

/**
 * Whose usage a call made outside anyone's run belongs to: a file ingested
 * by the queue, or a search that ran with no conversation behind it. The
 * workspace's creator when there is a workspace, else the bot's, so an
 * embedding never goes uncounted.
 */
export default async function grabUsageOwnerUserId({
    bot_id,
    workspace_id,
}: Params): Promise<number | null> {
    const workspace = Number(workspace_id);

    if (Number.isFinite(workspace) && workspace > 0) {
        const row = await BunSQLite.sql<{ user_id: number }>({
            sql: `SELECT user_id FROM workspaces WHERE id = ? LIMIT 1`,
            values: [workspace],
        }).then((res) => res.payload?.[0]);

        if (row?.user_id) return Number(row.user_id) || null;
    }

    const bot = Number(bot_id);

    if (Number.isFinite(bot) && bot > 0) {
        const row = await BunSQLite.sql<{ user_id: number }>({
            sql: `SELECT user_id FROM bots WHERE id = ? LIMIT 1`,
            values: [bot],
        }).then((res) => res.payload?.[0]);

        if (row?.user_id) return Number(row.user_id) || null;
    }

    return null;
}
