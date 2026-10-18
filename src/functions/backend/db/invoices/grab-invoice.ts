import type {
    BUN_SQLITE_BSQLITE_INVOICE_ITEMS,
    BUN_SQLITE_BSQLITE_INVOICE_QUOTES,
    BUN_SQLITE_BSQLITE_INVOICES,
} from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";
import BunSQLite from "@moduletrace/bun-sqlite";

export default async function grabInvoice({
    id,
}: {
    id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_INVOICES>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_INVOICES>({
        table: "invoices",
        targetId: id,
    });
}

export async function grabInvoiceItems({
    invoice_id,
}: {
    invoice_id: number | string;
}): Promise<APIResponseObject<BUN_SQLITE_BSQLITE_INVOICE_ITEMS>> {
    return await BunSQLite.select<BUN_SQLITE_BSQLITE_INVOICE_ITEMS>({
        table: "invoice_items",
        query: {
            query: {
                invoice_id: {
                    value: Number(invoice_id),
                },
            },
            order: [
                { field: "sort_order", strategy: "ASC" },
                { field: "id", strategy: "ASC" },
            ],
        },
    });
}

export type InvoiceQuoteLinkRecord = BUN_SQLITE_BSQLITE_INVOICE_QUOTES & {
    quote_number?: string;
    quote_title?: string;
};

export async function grabInvoiceQuoteLinks({
    invoice_id,
}: {
    invoice_id: number | string;
}): Promise<APIResponseObject<InvoiceQuoteLinkRecord>> {
    return await BunSQLite.sql<InvoiceQuoteLinkRecord>({
        sql: `
            SELECT
                iq.*,
                q.quote_number,
                q.title AS quote_title
            FROM invoice_quotes iq
            LEFT JOIN quotes q ON q.id = iq.quote_id
            WHERE iq.invoice_id = ?
            ORDER BY iq.id ASC
        `,
        values: [invoice_id],
    });
}