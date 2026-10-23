import type { DatabaseTableColumn, DatabaseTableKey } from "@/src/types";

type Params = {
    /**
     * The table's columns in their declared order.
     */
    columns: DatabaseTableColumn[];
    /**
     * Whether the table is one SQLite gives a rowid to: every ordinary
     * table has one, a virtual table and a `WITHOUT ROWID` table do not.
     */
    has_rowid: boolean;
};

/**
 * What a table's records are identified by: its primary key when that is
 * one column (a sqlite-vec index keeps its own `id`), else the rowid every
 * ordinary SQLite table has, else nothing, which leaves the browser able
 * to read a page but not to open one record.
 *
 * A composite primary key falls back to the rowid, which is the record's
 * own and shows in the key column either way.
 */
export default function resolveTableKey({ columns, has_rowid }: Params): DatabaseTableKey {
    const pk_columns = columns.filter((column) => column.pk);

    const [pk_column] = pk_columns;

    if (pk_column && pk_columns.length == 1) {
        return { kind: "column", name: pk_column.name };
    }

    if (has_rowid) {
        return { kind: "rowid" };
    }

    return { kind: "none" };
}
