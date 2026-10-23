import Paper from "@moduletrace/twui/elements/Paper";
import type { DatabaseRecordsPayload } from "@/src/types";
import DatabaseHeadCell from "./database-head-cell";
import DatabaseRecordRow from "./database-record-row";

type Props = {
    records: DatabaseRecordsPayload;
    onOpenRecord: (key: string | number) => void;
};

/**
 * One page of a table's records: every column in its declared order, with
 * its declared type on hover. A record with a key opens in full when any of
 * its cells is clicked; a table with no key at all (a virtual table with no
 * primary key) reads as plain cells, since nothing can open a record it
 * can't name.
 */
export default function DatabaseRecordsTable({ records, onOpenRecord }: Props) {
    const { table } = records;

    return (
        <Paper className="p-0 gap-0 overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
                    <tr>
                        {table.columns.map((column) => (
                            <DatabaseHeadCell
                                key={column.name}
                                title={column.name}
                                hint={column.type || undefined}
                            />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {records.records.map((record, index) => (
                        <DatabaseRecordRow
                            key={
                                record.key === null
                                    ? `row-${index}`
                                    : String(record.key)
                            }
                            record={record}
                            columns={table.columns.map((column) => column.name)}
                            onOpen={() => {
                                if (record.key !== null)
                                    onOpenRecord(record.key);
                            }}
                        />
                    ))}
                </tbody>
            </table>
        </Paper>
    );
}
