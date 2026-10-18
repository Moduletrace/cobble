import type {
    BUN_SQLITE_BSQLITE_QUOTE_ITEMS,
    BUN_SQLITE_BSQLITE_QUOTES,
} from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function grabQuote({
    id,
}: {
    id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_QUOTES>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_QUOTES>({
        table: "quotes",
        targetId: id,
    });
}

export async function grabQuoteItems({
    quote_id,
}: {
    quote_id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_QUOTE_ITEMS>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_QUOTE_ITEMS>({
        table: "quote_items",
        query: {
            query: {
                quote_id: {
                    value: Number(quote_id),
                },
            },
            order: [
                { field: "sort_order", strategy: "ASC" },
                { field: "id", strategy: "ASC" },
            ],
        },
    });
}