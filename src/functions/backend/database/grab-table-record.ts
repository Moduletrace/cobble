import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import buildRecordRow from "./build-record-row";
import { buildRecordSql, parseRecordKey } from "./build-records-sql";
import grabTableCatalogEntry from "./grab-table-catalog-entry";
import type { DatabaseRecordPayload } from "@/src/types";
import { AppData } from "@/src/data/app-data";

type Params = {
    table?: string | null;
    /**
     * The record's key, as it came in the query string.
     */
    key: string;
};

/**
 * One record of one table, in full for its modal: every value read whole
 * (up to `AppData.DatabaseBrowserValueMaxChars`, since a megabyte of blob
 * or checkpoint is not something to render), so a cell cut short in the
 * table can still be read to its end.
 */
export default async function grabTableRecord({ table, key }: Params): Promise<DatabaseRecordPayload> {
    const entry = await grabTableCatalogEntry({ table });

    if (entry.key.kind == "none") {
        throw new AppError(`"${entry.name}" has no key to open a single record by.`);
    }

    const columns = entry.columns.map((column) => column.name);
    const query = buildRecordSql({
        table: entry.name,
        columns,
        key: entry.key,
        max_chars: AppData.DatabaseBrowserValueMaxChars,
        value: parseRecordKey({ value: key }),
    });
    const res = await BunSQLite.sql<Record<string, unknown>>(query);

    if (!res.success) {
        throw new AppError(`Couldn't read that record of "${entry.name}".`);
    }

    const row = res.payload?.[0];

    if (!row) {
        throw new AppError(`That record isn't in "${entry.name}" any more.`);
    }

    return {
        table: entry,
        record: buildRecordRow({
            row,
            columns: entry.columns,
            max_chars: AppData.DatabaseBrowserValueMaxChars,
        }),
    };
}
