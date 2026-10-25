import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHookCall } from "@/src/types";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
    event_id: number | string;
    /**
     * Only a call to this bot's hooks.
     */
    bot_id?: number | string | null;
};

/**
 * One call to one of the user's hooks, whole: what it sent and what its
 * run answered. Throws when it isn't theirs (or that bot's).
 */
export default async function grabBotHookEvent({ user_id, event_id, bot_id }: Params) {
    const res = await BunSQLite.sql<BotHookCall>({
        sql: `SELECT e.*, h.title AS hook_title, h.bot_id, h.workspace_id
            FROM bot_hook_events e JOIN bot_hooks h ON h.id = e.hook_id
            WHERE e.id = ? AND h.user_id = ? AND (? IS NULL OR h.bot_id = ?)`,
        values: [Number(event_id), user_id, bot_id ? Number(bot_id) : null, bot_id ? Number(bot_id) : null],
    });

    const call = res.payload?.[0];

    if (!call?.id) {
        throw new AppError(`Hook call #${event_id} not found.`);
    }

    return call;
}
