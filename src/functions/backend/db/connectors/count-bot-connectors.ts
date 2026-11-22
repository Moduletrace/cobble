import BunSQLite from "@moduletrace/bun-sqlite";
import botConnectorsSql from "@/src/utils/bot-connectors-sql";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * How many apps this person's runs on this bot can reach, so the composer's
 * tools count includes connectors without reading them all.
 */
export default async function countBotConnectors({ user_id, bot_id, workspace_id }: Params): Promise<number> {
    const { sql, values } = botConnectorsSql({ user_id, bot_id, workspace_id });
    const res = await BunSQLite.sql<{ total: number }>({
        sql: `SELECT COUNT(*) AS total FROM (${sql}) x`,
        values,
    });

    return Number(res.payload?.[0]?.total || 0);
}