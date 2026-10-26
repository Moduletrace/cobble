import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTypeRow } from "@/src/utils/rbac/bot-types-in";

type Params = {
    bot_id: number | string;
};

/**
 * A bot's types (`bot_types`), each held in one workspace. Its kind
 * (`bots.kind`) is read on its own.
 */
export default async function grabBotTypes({ bot_id }: Params): Promise<BotTypeRow[]> {
    const res = await BunSQLite.sql<BotTypeRow>({
        sql: `SELECT bot_type, workspace_id FROM bot_types WHERE bot_id = ? AND workspace_id IS NOT NULL`,
        values: [Number(bot_id)],
    });

    return res.payload || [];
}
