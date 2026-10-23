import BunSQLite from "@moduletrace/bun-sqlite";
import quoteSqlIdentifier from "./quote-sql-identifier";
import resolveTableKey from "./resolve-table-key";
import type { DatabaseTableSummary } from "@/src/types";
import type { TableCatalogEntry } from "./table-catalog-types";

type Params = {
    tables: TableCatalogEntry[];
    /**
     * How many bytes each table takes on disk, by name; empty when SQLite
     * can't measure it, which leaves the size column blank.
     */
    sizes: Map<string, number>;
};

type CountRow = { rows: number };

/**
 * The catalog as the browser lists it: every table with its record count,
 * its size on disk, its columns and what identifies its records.
 *
 * Each count is its own tiny statement rather than one aggregate, because
 * a virtual table has no rowid to build one from, and the whole read stays
 * in the low milliseconds for the install's fifty-odd tables.
 */
export default async function buildDatabaseTables({ tables, sizes }: Params): Promise<DatabaseTableSummary[]> {
    const summaries: DatabaseTableSummary[] = [];

    for (const table of tables) {
        const size = sizes.get(table.name);

        summaries.push({
            name: table.name,
            type: table.type,
            rows: await countRows({ table: table.name }),
            size_bytes: size === undefined ? null : size,
            columns: table.columns,
            key: resolveTableKey({ columns: table.columns, has_rowid: table.has_rowid }),
        });
    }

    return summaries;
}

async function countRows({ table }: { table: string }): Promise<number | null> {
    const res = await BunSQLite.sql<CountRow>({
        sql: `SELECT COUNT(*) AS rows FROM ${quoteSqlIdentifier({ name: table })}`,
    });

    if (!res.success || !res.payload?.[0]) {
        /**
         * A table the module won't count (an index over a table whose
         * module is missing) is still a table; it just has no count.
         */
        return null;
    }

    return Number(res.payload[0].rows) || 0;
}
