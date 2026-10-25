import BunSQLite from "@moduletrace/bun-sqlite";
import type { SecretRequestStatus } from "@/src/dict/env-dict";
import type { SecretRequestView } from "@/src/types";
import grabSecretRequest from "./grab-secret-request";

type Params = {
    request_id: number | string;
    user_id: number | string;
};

/**
 * A secret request as its chip and card show it: the key, what it's for
 * and why the bot asks. Never a value: the request never holds one.
 */
export default async function grabSecretRequestView({ request_id, user_id }: Params): Promise<SecretRequestView> {
    const row = await grabSecretRequest({ request_id, user_id });

    const bot = (
        await BunSQLite.sql<{ name: string }>({
            sql: `SELECT name FROM bots WHERE id = ? LIMIT 1`,
            values: [row.bot_id || 0],
        })
    ).payload?.[0];

    return {
        id: Number(row.id),
        key: row.key || "",
        description: row.description || "",
        reason: row.reason || "",
        status: (row.status || "pending") as SecretRequestStatus,
        bot_id: Number(row.bot_id),
        bot_name: bot?.name || "The bot",
        env_id: row.env_id ? Number(row.env_id) : null,
    };
}
