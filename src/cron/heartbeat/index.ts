import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function heartbeat() {
    const db_alive = await BunSQLite.sql({
        sql: `SELECT 1 AS alive`,
    });

    bunext.bunextLog.info(
        `Cron: database heartbeat ${db_alive.success ? "ok" : "failed"}`,
    );

    return db_alive;
}