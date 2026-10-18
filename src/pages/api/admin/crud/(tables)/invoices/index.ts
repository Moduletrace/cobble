import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import { SiteData } from "@/src/data/site-data";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import grabNextDocumentSequence from "@/src/functions/backend/db/documents/grab-next-document-sequence";
import type { AdminCrudAPIParams } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import {
    gatedCrudDelete,
    gatedCrudGet,
    gatedCrudPut,
} from "../../(utils)/gated-crud";

function invoiceNumberPrefix(): string {
    const now = new Date();

    return `${SiteData["SiteSlug"].toUpperCase()}-${now.getFullYear()}${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
}

async function buildInvoiceRows({
    rows,
}: {
    rows: BUN_SQLITE_BSQLITE_INVOICES[];
}): Promise<BUN_SQLITE_BSQLITE_INVOICES[]> {
    const prefix = invoiceNumberPrefix();
    let next_sequence: number | undefined;
    const final_rows: BUN_SQLITE_BSQLITE_INVOICES[] = [];

    for (const row of rows) {
        const invoice_row = { ...row } as BUN_SQLITE_BSQLITE_INVOICES;

        if (!invoice_row.invoice_number) {
            next_sequence ??= await grabNextDocumentSequence({
                table: "invoices",
                column: "invoice_number",
                prefix,
            });

            invoice_row.invoice_number = `${prefix}-${String(next_sequence).padStart(3, "0")}`;
            next_sequence += 1;
        }

        final_rows.push(invoice_row);
    }

    return final_rows;
}

export default async function (
    params: AdminCrudAPIParams,
): Promise<APIResponseObject> {
    switch (params.req.method) {
        case "GET":
            return await gatedCrudGet(params);
        case "POST": {
            const { table, body, user_types } = params;

            const access = checkUserAccess({
                user_types,
                includes: ["admin"],
            });

            if (!access.success) {
                return access;
            }

            if (!body?.insert_data) {
                return {
                    success: false,
                    msg: `No data to insert`,
                };
            }

            for (let attempt = 0; attempt < 5; attempt++) {
                const final_insert_data = await buildInvoiceRows({
                    rows: body.insert_data as BUN_SQLITE_BSQLITE_INVOICES[],
                });

                try {
                    return await BunSQLite.insert({
                        table,
                        data: final_insert_data,
                        update_on_duplicate: body.update_on_duplicate,
                    });
                } catch (error: any) {
                    if (attempt >= 4) {
                        throw error;
                    }
                }
            }

            throw new Error(`Couldn't create invoice`);
        }
        case "PUT":
            return await gatedCrudPut(params);
        case "DELETE":
            return await gatedCrudDelete(params);

        default:
            return {
                success: false,
                msg: `Unhandled`,
            };
    }
}