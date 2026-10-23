/**
 * One row of the table catalog: one column of one table.
 */
export type TableCatalogRow = {
    table_name: string;
    table_type: "table" | "virtual";
    /**
     * 1 when the table was created `WITHOUT ROWID`.
     */
    without_rowid: number;
    column_index: number;
    column_name: string;
    column_type: string | null;
    /**
     * Where the column sits in the table's primary key; 0 when it isn't
     * one.
     */
    column_pk: number;
};

/**
 * One table of the catalog.
 */
export type TableCatalogEntry = {
    name: string;
    type: "table" | "virtual";
    /**
     * Whether SQLite gives the table a rowid: an ordinary table does, a
     * `WITHOUT ROWID` table and a virtual table do not.
     */
    has_rowid: boolean;
    columns: { name: string; type: string; pk: boolean }[];
};
