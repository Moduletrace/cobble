import Loading from "@moduletrace/twui/elements/Loading";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { DatabaseRecordPayload, DatabaseTableSummary } from "@/src/types";
import DatabaseRecordField from "./database-record-field";

type Props = {
    table: DatabaseTableSummary;
    record: DatabaseRecordPayload | null;
    loading: boolean;
    error?: string;
};

/**
 * What the record modal says before a record lands, and the record itself
 * once it does: every column's whole value, in the order the table
 * declares them.
 */
export default function DatabaseRecordBody({ table, record, loading, error }: Props) {
    if (error) {
        return (
            <Paper>
                <Center className="p-10">
                    <Span size="small">{error}</Span>
                </Center>
            </Paper>
        );
    }

    const full = record?.record;

    if (loading || !full) {
        return (
            <Paper>
                <Center className="p-16">
                    <Loading />
                </Center>
            </Paper>
        );
    }

    return (
        <Stack className="w-full items-stretch gap-0 max-h-[70vh] overflow-y-auto">
            {table.columns.map((column) => (
                <DatabaseRecordField key={column.name} column={column} cell={full.cells[column.name]} />
            ))}
        </Stack>
    );
}
