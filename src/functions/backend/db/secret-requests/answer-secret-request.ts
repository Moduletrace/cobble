import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import saveUserSecret from "../envs/save-user-secret";
import grabSecretRequest from "./grab-secret-request";

type Params = {
    request_id: number | string;
    user_id: number | string;
    value: string;
};

/**
 * The user typed the secret a bot asked for into its card: claims the
 * request once (only a pending one moves, so a double click saves once),
 * then saves the value as their personal secret for that bot
 * (`saveUserSecret`). A failed save puts the request back to pending.
 * The value is never stored on the request.
 */
export default async function answerSecretRequest({ request_id, user_id, value }: Params) {
    const request = await grabSecretRequest({ request_id, user_id });
    const now = Date.now();

    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE secret_requests SET status = 'saved', decided_at = ?, updated_at = ?
            WHERE id = ? AND status = 'pending' RETURNING id`,
        values: [now, now, Number(request.id)],
    });

    if (!claimed.payload?.[0]) throw new AppError(`This request was already ${request.status}.`);

    try {
        const env_id = await saveUserSecret({
            user_id,
            bot_id: request.bot_id || 0,
            key: request.key || "",
            value,
            description: request.description || "",
        });

        await BunSQLite.sql({
            sql: `UPDATE secret_requests SET env_id = ?, updated_at = ? WHERE id = ?`,
            values: [env_id, Date.now(), Number(request.id)],
        });

        return request;
    } catch (error) {
        await BunSQLite.sql({
            sql: `UPDATE secret_requests SET status = 'pending', decided_at = NULL, updated_at = ? WHERE id = ?`,
            values: [Date.now(), Number(request.id)],
        });

        throw error;
    }
}
