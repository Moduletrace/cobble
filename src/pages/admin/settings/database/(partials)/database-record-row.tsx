import type { DatabaseRecord } from "@/src/types";
import DatabaseCell from "./database-cell";

type Props = {
    record: DatabaseRecord;
    columns: string[];
    onOpen: () => void;
};

/**
 * One record as a table row: every column's value cut to its cell, none of
 * them spanning the whole value. A cell is the way into the record, so a
 * long text can be read to its end.
 */
export default function DatabaseRecordRow({ record, columns, onOpen }: Props) {
    return (
        <tr className="border-t border-slate-200 dark:border-white/10">
            {columns.map((column) => (
                <DatabaseCell
                    key={column}
                    cell={record.cells[column]}
                    openable={record.key !== null}
                    onOpen={onOpen}
                />
            ))}
        </tr>
    );
}
