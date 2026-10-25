import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTypeRow } from "@/src/utils/rbac/bot-types-in";

type Params = {
    bot_id: number | string;
};

/**
 * A bot's types (`bot_types`), plus the install-wide coordinator type for
 * the legacy `kind = 'coordinator'` bot, so the coordinator keeps its
 * powers before `ensureCoordinatorBot` has written its row.
 */
export default async function grabBotTypes({ bot_id }: Params): Promise<BotTypeRow[]> {
    const res = await BunSQLite.sql<BotTypeRow>({
        sql: `SELECT bot_type, workspace_id FROM bot_types WHERE bot_id = ?
            UNION SELECT 'coordinator' AS bot_type, NULL AS workspace_id FROM bots WHERE id = ? AND kind = 'coordinator'`,
        values: [Number(bot_id), Number(bot_id)],
    });

    return res.payload || [];
}
