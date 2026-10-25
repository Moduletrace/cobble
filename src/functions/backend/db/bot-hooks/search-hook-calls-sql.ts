import { AppData } from "@/src/data/app-data";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";

export type SearchHookCallsParams = {
    /**
     * Whose hooks: only calls to hooks this user owns are ever read.
     */
    user_id: number | string;
    hook_id?: number | string | null;
    bot_id?: number | string | null;
    /**
     * Words to find in what a call sent or what its run answered.
     */
    query?: string | null;
    status?: BotHookEventStatus | null;
    /**
     * Only calls older than this one (paging).
     */
    before_id?: number | string | null;
    limit?: number;
    /**
     * How much of each payload and response comes back.
     */
    preview_chars?: number;
};

/**
 * Finds calls to the user's hooks, newest first, with each one's hook name
 * and bot. Payloads and responses are cut in SQL, so a list never carries
 * whole bodies. `%` and `_` in the query match only themselves.
 */
export default function searchHookCallsSql({
    user_id,
    hook_id,
    bot_id,
    query,
    status,
    before_id,
    limit = 20,
    preview_chars = AppData.BotHookCallPreviewChars,
}: SearchHookCallsParams) {
    const where = [`h.user_id = ?`];
    const values: (string | number)[] = [preview_chars, preview_chars, user_id];

    if (hook_id) {
        where.push(`e.hook_id = ?`);
        values.push(Number(hook_id));
    }

    if (bot_id) {
        where.push(`h.bot_id = ?`);
        values.push(Number(bot_id));
    }

    if (status) {
        where.push(`e.status = ?`);
        values.push(status);
    }

    if (before_id) {
        where.push(`e.id < ?`);
        values.push(Number(before_id));
    }

    const search = query?.trim();

    if (search) {
        const like = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

        where.push(`(e.payload LIKE ? ESCAPE '\\' OR e.response LIKE ? ESCAPE '\\' OR e.error LIKE ? ESCAPE '\\')`);
        values.push(like, like, like);
    }

    values.push(Math.min(Math.max(Math.floor(limit) || 20, 1), 100));

    return {
        sql: `SELECT e.id, e.created_at, e.hook_id, e.job_id, substr(e.payload, 1, ?) AS payload, e.content_type,
                e.source_ip, e.idempotency_key, e.status, e.error, substr(e.response, 1, ?) AS response,
                e.response_message_id, e.responded_at, h.title AS hook_title, h.bot_id, h.workspace_id
            FROM bot_hook_events e JOIN bot_hooks h ON h.id = e.hook_id
            WHERE ${where.join(" AND ")}
            ORDER BY e.id DESC LIMIT ?`,
        values,
    };
}
