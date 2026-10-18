import type { BUN_SQLITE_BSQLITE_EMAILS } from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function grabEmail({
    id,
}: {
    id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_EMAILS>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_EMAILS>({
        table: "emails",
        targetId: id,
    });
}