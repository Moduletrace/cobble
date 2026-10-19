import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * Every user who sees a bot (`grabUserBot`), for live updates about it:
 * the super admin, and for a worker the admins, the users it's assigned
 * to and the members of its workspaces.
 */
export default async function grabBotAudience({ bot_id }: Params): Promise<number[]> {
    const res = await BunSQLite.sql<{ user_id: number }>({
        sql: `SELECT user_id FROM user_types WHERE user_type = 'super_admin'
            UNION
            SELECT ut.user_id FROM user_types ut JOIN bots b ON b.id = ? AND b.kind != 'coordinator'
            WHERE ut.user_type = 'admin'
            UNION
            SELECT bu.user_id FROM bot_users bu JOIN bots b ON b.id = bu.bot_id AND b.kind != 'coordinator'
            WHERE bu.bot_id = ?
            UNION
            SELECT wu.user_id FROM workspace_users wu
            JOIN workspace_bots wb ON wb.workspace_id = wu.workspace_id AND wb.bot_id = ?
            JOIN workspaces w ON w.id = wu.workspace_id AND w.archived = 0
            JOIN bots b ON b.id = wb.bot_id AND b.kind != 'coordinator'`,
        values: [bot_id, bot_id, bot_id],
    });

    return (res.payload || []).map((row) => Number(row.user_id)).filter(Boolean);
}
