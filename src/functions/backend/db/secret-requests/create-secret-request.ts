import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_SECRET_REQUESTS, BunSQLiteTables } from "@/db/types/db";
import checkSecretKey from "@/src/utils/check-secret-key";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    key: string;
    description: string;
    reason: string;
};

/**
 * Stores a secret a bot asks the user for, pending until they type it
 * into its card. A request still pending for the same key in the same
 * conversation is reused (its description and reason updated), so asking
 * twice shows one card. Returns its id.
 */
export default async function createSecretRequest({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    key,
    description,
    reason,
}: Params) {
    const final_key = checkSecretKey({ key });
    const now = Date.now();

    const pending = (
        await BunSQLite.sql<{ id: number }>({
            sql: `UPDATE secret_requests SET description = ?, reason = ?, updated_at = ?
                WHERE session_id = ? AND user_id = ? AND bot_id = ? AND key = ? AND status = 'pending'
                RETURNING id`,
            values: [description, reason, now, Number(session_id), Number(user_id), Number(bot_id), final_key],
        })
    ).payload?.[0];

    if (pending?.id) return Number(pending.id);

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_SECRET_REQUESTS, (typeof BunSQLiteTables)[number]>({
        table: "secret_requests",
        data: [
            {
                key: final_key,
                description,
                reason,
                status: "pending",
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the request: ${res.msg}`);

    return id;
}
