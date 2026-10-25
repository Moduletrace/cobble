import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabSecretRequest from "./grab-secret-request";

type Params = {
    request_id: number | string;
    user_id: number | string;
};

/**
 * The user declined a secret a bot asked for: nothing is saved.
 */
export default async function declineSecretRequest({ request_id, user_id }: Params) {
    const request = await grabSecretRequest({ request_id, user_id });
    const now = Date.now();

    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE secret_requests SET status = 'declined', decided_at = ?, updated_at = ?
            WHERE id = ? AND status = 'pending' RETURNING id`,
        values: [now, now, Number(request.id)],
    });

    if (!claimed.payload?.[0]) throw new AppError(`This request was already ${request.status}.`);

    return request;
}
