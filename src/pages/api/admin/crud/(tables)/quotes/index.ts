import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
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

function quoteNumberPrefix(): string {
    const now = new Date();

    return `${SiteData["SiteSlug"].toUpperCase()}Q-${now.getFullYear()}${String(
        now.getMonth() + 1,
    ).padStart(2, "0")}`;
}

async function buildQuoteRows({
    rows,
}: {
    rows: BUN_SQLITE_BSQLITE_QUOTES[];
}): Promise<BUN_SQLITE_BSQLITE_QUOTES[]> {
    const prefix = quoteNumberPrefix();
    let next_sequence: number | undefined;
    const final_rows: BUN_SQLITE_BSQLITE_QUOTES[] = [];

    for (const row of rows) {
        const quote_row = { ...row } as BUN_SQLITE_BSQLITE_QUOTES;

        if (!quote_row.quote_number) {
            next_sequence ??= await grabNextDocumentSequence({
                table: "quotes",
                column: "quote_number",
                prefix,
            });

            quote_row.quote_number = `${prefix}-${String(next_sequence).padStart(3, "0")}`;
            next_sequence += 1;
        }

        final_rows.push(quote_row);
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
                const final_insert_data = await buildQuoteRows({
                    rows: body.insert_data as BUN_SQLITE_BSQLITE_QUOTES[],
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

            throw new Error(`Couldn't create quote`);
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