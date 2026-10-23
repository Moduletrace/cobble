import formatBytes from "@/src/utils/format-bytes";
import type { DatabaseRecordsPayload, DatabaseTableSummary } from "@/src/types";

type Params = {
    table: DatabaseTableSummary;
    /**
     * The page of records under the line, for the matched count of a
     * search.
     */
    records: DatabaseRecordsPayload | null;
};

/**
 * What the open table is, above its records: how many it holds, how many
 * a search matched, what it takes on disk and how wide it is.
 */
export default function tableSummaryText({ table, records }: Params): string {
    const rows = table.rows === null ? "-" : table.rows.toLocaleString();
    const size = table.size_bytes === null ? "" : `, ${formatBytes({ bytes: table.size_bytes })} on disk`;
    const matched = records?.search ? `, ${records.total.toLocaleString()} matching` : "";
    const columns = `${table.columns.length} column${table.columns.length == 1 ? "" : "s"}`;

    return `${rows} record${table.rows == 1 ? "" : "s"}${matched}${size} - ${columns}`;
}
