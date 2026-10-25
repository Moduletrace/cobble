import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS } from "@/db/types/db";
import grabUserBotHook from "./grab-user-bot-hook";

type Params = {
    user_id: number | string;
    hook_id: number | string;
    limit?: number;
};

/**
 * One of the user's hooks' latest calls, newest first, each payload cut
 * to a preview in SQL.
 */
export default async function grabBotHookEvents({ user_id, hook_id, limit = 20 }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS>({
        sql: `SELECT id, created_at, hook_id, job_id, substr(payload, 1, 400) AS payload, content_type,
                source_ip, idempotency_key, status, error
            FROM bot_hook_events WHERE hook_id = ? ORDER BY id DESC LIMIT ?`,
        values: [hook.id!, Math.min(Math.max(limit, 1), 100)],
    });

    return res.payload || [];
}
