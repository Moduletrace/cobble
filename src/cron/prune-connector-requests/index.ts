import BunSQLite from "@moduletrace/bun-sqlite";

const KeepMs = 7 * 24 * 60 * 60 * 1000;
const PendingGraceMs = 24 * 60 * 60 * 1000;

/**
 * Deletes old connect requests: anything ended a week ago, and a pending
 * one a day past the link's expiry. The accounts themselves stay; a
 * request is only the sign-in that made one.
 */
export default async function pruneConnectorRequests() {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `DELETE FROM connector_requests
            WHERE (status != 'pending' AND created_at < ?)
                OR (status = 'pending' AND expires_at < ?)`,
        values: [now - KeepMs, now - PendingGraceMs],
    });
}