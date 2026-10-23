import BunSQLite from "@moduletrace/bun-sqlite";
import buildTableSizesSql, { type TableSizeRow } from "./build-table-sizes-sql";

/**
 * How many bytes each table takes on disk, by table name. Empty when
 * SQLite was built without the `dbstat` vtab, which only costs the browser
 * its size column: the records still read.
 */
export default async function grabTableSizes(): Promise<Map<string, number>> {
    const sizes = new Map<string, number>();
    const res = await BunSQLite.sql<TableSizeRow>({ sql: buildTableSizesSql() });

    if (!res.success || !res.payload) return sizes;

    for (const row of res.payload) {
        sizes.set(row.table_name, Number(row.bytes) || 0);
    }

    return sizes;
}
