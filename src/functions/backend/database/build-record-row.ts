import { metaColumnAlias, RecordKeyAlias } from "./build-records-sql";
import toDatabaseCell from "./to-database-cell";
import type { DatabaseRecord, DatabaseTableColumn } from "@/src/types";

type Params = {
    /**
     * The row as SQLite returned it, its meta columns included.
     */
    row: Record<string, unknown>;
    columns: DatabaseTableColumn[];
    max_chars: number;
};

/**
 * One row of a records query as a record the browser can draw: its key,
 * and every column's value as a cell. The meta columns the query added
 * (`typeof` and `length` per column) are read and dropped here, so they
 * never reach the client.
 */
export default function buildRecordRow({ row, columns, max_chars }: Params): DatabaseRecord {
    const cells: Record<string, DatabaseRecord["cells"][string]> = {};

    for (const column of columns) {
        cells[column.name] = toDatabaseCell({
            value: row[column.name],
            type: String(row[metaColumnAlias({ name: column.name, kind: "type" })] ?? "null"),
            length: Number(row[metaColumnAlias({ name: column.name, kind: "length" })] ?? 0),
            max_chars,
        });
    }

    const key = row[RecordKeyAlias];

    return {
        key:
            typeof key == "string" || typeof key == "number"
                ? key
                : key === null || key === undefined
                  ? null
                  : String(key),
        cells,
    };
}
