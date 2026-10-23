import BunSQLite from "@moduletrace/bun-sqlite";
import buildDatabaseTables from "./build-database-tables";
import buildTableCatalogSql from "./build-table-catalog-sql";
import grabTableSizes from "./grab-table-sizes";
import groupTableCatalog from "./group-table-catalog";
import type { TableCatalogRow } from "./table-catalog-types";
import type { DatabaseTableSummary } from "@/src/types";

/**
 * Every table the database browser lists: the catalog read in one
 * statement (`buildTableCatalogSql`), the sizes on disk, then a count each.
 * Empty when the catalog can't be read, which leaves the page saying so
 * rather than failing.
 */
export default async function grabDatabaseTables(): Promise<DatabaseTableSummary[]> {
    const res = await BunSQLite.sql<TableCatalogRow>({ sql: buildTableCatalogSql() });

    if (!res.success || !res.payload) return [];

    const tables = groupTableCatalog({ rows: res.payload });

    if (!tables.length) return [];

    return await buildDatabaseTables({ tables, sizes: await grabTableSizes() });
}
