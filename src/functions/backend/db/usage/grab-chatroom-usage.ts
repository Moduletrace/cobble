import BunSQLite from "@moduletrace/bun-sqlite";
import type { ChatroomUsage, ChatroomUsageBot } from "@/src/types";
import { chatroomUsageCallsSql, chatroomUsageFailuresSql } from "./chatroom-usage-sql";
import { sumSummary, toSummary } from "./grab-usage-totals";

type Params = {
    /**
     * The rooms whose usage is summed. A room no call touched is absent.
     */
    chatroom_ids: (number | string)[];
};

type CallRow = {
    chatroom_id: number;
    bot_id: number | null;
    calls: number | null;
    prompt_tokens: number | null;
    cached_tokens: number | null;
    completion_tokens: number | null;
    cost: number | null;
};

type FailureRow = {
    chatroom_id: number;
    failed_calls: number | null;
};

/**
 * What each room's bots spent working in it: every model call they made
 * there summed with the calls that failed, in total and per bot. A call
 * belongs to the room through its run's own session, so a coordinator
 * turn still running is counted before its answer is written, and a room's
 * totals never wait for a message to land.
 */
export default async function grabChatroomUsage({ chatroom_ids }: Params): Promise<Map<number, ChatroomUsage>> {
    const usage = new Map<number, ChatroomUsage>();
    const ids = [...new Set(chatroom_ids.map(Number).filter((id) => id > 0))];

    if (!ids.length) return usage;

    const [call_res, failure_res] = await Promise.all([
        BunSQLite.sql<CallRow>(chatroomUsageCallsSql({ chatroom_ids: ids })),
        BunSQLite.sql<FailureRow>(chatroomUsageFailuresSql({ chatroom_ids: ids })),
    ]);

    const calls = call_res.payload || [];
    const failures = new Map(
        (failure_res.payload || []).map((row) => [Number(row.chatroom_id), Number(row.failed_calls) || 0]),
    );
    const bot_ids = [...new Set(calls.map((row) => Number(row.bot_id)).filter((id) => id > 0))];
    const names = new Map(
        (
            bot_ids.length
                ? (
                      await BunSQLite.sql<{ id: number; name: string }>({
                          sql: `SELECT id, name FROM bots WHERE id IN (${bot_ids.map(() => "?").join(", ")})`,
                          values: bot_ids,
                      })
                  ).payload || []
                : []
        ).map((row) => [Number(row.id), row.name || null]),
    );

    for (const id of ids) {
        const by_bot: ChatroomUsageBot[] = calls
            .filter((row) => Number(row.chatroom_id) == id)
            .map((row) => ({
                bot_id: Number(row.bot_id) || 0,
                name: names.get(Number(row.bot_id)) || null,
                ...toSummary({ row }),
            }))
            .sort((a, b) => b.total_tokens - a.total_tokens || b.calls - a.calls);

        usage.set(id, {
            totals: sumSummary({ summaries: by_bot }),
            failed_calls: failures.get(id) || 0,
            by_bot,
        });
    }

    return usage;
}