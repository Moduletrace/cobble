import type { TableCatalogEntry, TableCatalogRow } from "./table-catalog-types";

type Params = {
    rows: TableCatalogRow[];
};

/**
 * Groups the catalog's rows per table, keeping the statement's order, so
 * the list of tables and every table's columns come back in one read.
 */
export default function groupTableCatalog({ rows }: Params): TableCatalogEntry[] {
    const entries: TableCatalogEntry[] = [];

    for (const row of rows) {
        let entry = entries.at(-1);

        if (!entry || entry.name != row.table_name) {
            entry = {
                name: row.table_name,
                type: row.table_type,
                has_rowid: row.table_type == "table" && !row.without_rowid,
                columns: [],
            };
            entries.push(entry);
        }

        entry.columns.push({
            name: row.column_name,
            type: row.column_type || "",
            pk: Boolean(row.column_pk),
        });
    }

    return entries;
}
