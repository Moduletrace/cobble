import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES, BunSQLiteTables } from "@/db/types/db";
import type { BotJobUpdateKind } from "@/src/dict/bot-queue-dict";

type Params = {
    job_id: number;
    bot_id: number;
    kind: BotJobUpdateKind;
    text: string;
    metadata?: Record<string, unknown>;
};

/**
 * Records one step of a running job (`bots_queue_updates`) and returns the
 * row, for the live push.
 */
export default async function insertBotJobUpdate({
    job_id,
    bot_id,
    kind,
    text,
    metadata,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES> {
    const row: BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES = {
        bots_queue_id: job_id,
        bot_id,
        kind,
        text,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
    };

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bots_queue_updates",
        data: [row],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Failed to save the job update: ${res.msg}`);
    }

    return { ...row, id, created_at: Date.now() };
}
