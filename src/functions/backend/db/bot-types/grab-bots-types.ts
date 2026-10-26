import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTypeRow } from "@/src/utils/rbac/bot-types-in";

type Params = {
    bot_ids: (number | string | "" | undefined)[];
};

type Row = BotTypeRow & { bot_id: number };

/**
 * `grabBotTypes` for a list of bots at once, keyed by bot id. A bot with no
 * row is missing from the map (just its kind).
 */
export default async function grabBotsTypes({ bot_ids }: Params): Promise<Map<number, BotTypeRow[]>> {
    const ids = [...new Set(bot_ids.map(Number).filter(Boolean))];
    const map = new Map<number, BotTypeRow[]>();

    if (!ids.length) return map;

    const marks = ids.map(() => "?").join(", ");
    const res = await BunSQLite.sql<Row>({
        sql: `SELECT bot_id, bot_type, workspace_id FROM bot_types WHERE bot_id IN (${marks}) AND workspace_id IS NOT NULL`,
        values: ids,
    });

    for (const row of res.payload || []) {
        const list = map.get(row.bot_id) || [];
        list.push({ bot_type: row.bot_type, workspace_id: row.workspace_id });
        map.set(row.bot_id, list);
    }

    return map;
}
