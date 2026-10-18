import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function grabLetter({
    id,
}: {
    id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_LETTERS>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_LETTERS>({
        table: "letters",
        targetId: id,
    });
}