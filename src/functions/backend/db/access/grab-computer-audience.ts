import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
};

/**
 * Every user who sees a computer (`computersSql`), for live updates about
 * it: super admins and admins, and the users whose workspaces or assigned
 * workers use it.
 */
export default async function grabComputerAudience({ computer_id }: Params): Promise<number[]> {
    const res = await BunSQLite.sql<{ user_id: number }>({
        sql: `SELECT user_id FROM user_types WHERE user_type IN ('super_admin', 'admin')
            UNION
            SELECT wu.user_id FROM workspace_users wu
            JOIN workspace_computers wc ON wc.workspace_id = wu.workspace_id AND wc.computer_id = ?
            UNION
            SELECT bu.user_id FROM bot_users bu
            JOIN bot_computers bc ON bc.bot_id = bu.bot_id AND bc.computer_id = ?
            JOIN bots b ON b.id = bu.bot_id AND b.kind != 'coordinator'`,
        values: [computer_id, computer_id],
    });

    return (res.payload || []).map((row) => Number(row.user_id)).filter(Boolean);
}
