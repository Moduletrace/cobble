import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFileScope } from "@/src/dict/bot-file-dict";

type Params = {
    scope: BotFileScope;
    owner_id: number | string;
};

type UsageRow = {
    total: number | null;
    files: number | null;
};

/**
 * How many bytes (and files) a directory holds.
 */
export default async function grabStorageUsage({ scope, owner_id }: Params) {
    const res = await BunSQLite.sql<UsageRow>({
        sql: `SELECT COALESCE(SUM(size), 0) AS total, COUNT(*) AS files FROM bot_files WHERE scope = ? AND owner_id = ?`,
        values: [scope, owner_id],
    });

    const row = res.payload?.[0];

    return {
        bytes: Number(row?.total) || 0,
        files: Number(row?.files) || 0,
    };
}

/**
 * Every directory's usage at once, for the settings page.
 */
export async function grabStorageUsageByOwner() {
    const res = await BunSQLite.sql<{ scope: string; owner_id: number; total: number; files: number }>({
        sql: `SELECT scope, owner_id, SUM(size) AS total, COUNT(*) AS files FROM bot_files GROUP BY scope, owner_id`,
        values: [],
    });

    return (res.payload || []).map((row) => ({
        scope: row.scope as BotFileScope,
        owner_id: Number(row.owner_id),
        bytes: Number(row.total) || 0,
        files: Number(row.files) || 0,
    }));
}

/**
 * Total bytes across every directory.
 */
export async function grabTotalStorageUsage() {
    const res = await BunSQLite.sql<{ total: number | null; files: number | null }>({
        sql: `SELECT COALESCE(SUM(size), 0) AS total, COUNT(*) AS files FROM bot_files`,
        values: [],
    });

    return {
        bytes: Number(res.payload?.[0]?.total) || 0,
        files: Number(res.payload?.[0]?.files) || 0,
    };
}
