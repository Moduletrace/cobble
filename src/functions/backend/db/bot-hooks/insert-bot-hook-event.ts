import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";

type Params = {
    hook_id: number;
    payload: string;
    content_type?: string | null;
    source_ip?: string | null;
    idempotency_key?: string | null;
    status: BotHookEventStatus;
    /**
     * The run it queued or joined.
     */
    job_id?: number;
    error?: string;
    now?: number;
};

/**
 * Records one call to a hook and what became of it, for its recent calls.
 * Returns the event id.
 */
export default async function insertBotHookEvent({
    hook_id,
    payload,
    content_type,
    source_ip,
    idempotency_key,
    status,
    job_id,
    error,
    now = Date.now(),
}: Params) {
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS, (typeof BunSQLiteTables)[number]>({
        table: "bot_hook_events",
        data: [
            {
                hook_id,
                job_id,
                payload: payload.slice(0, AppData.BotHookMaxPayloadBytes),
                content_type: content_type?.slice(0, 200) || undefined,
                source_ip: source_ip || undefined,
                idempotency_key: idempotency_key || undefined,
                status,
                error,
                created_at: now,
            },
        ],
    });

    return Number(res.singleRes?.id || res.postInsertReturn?.insertId) || undefined;
}
