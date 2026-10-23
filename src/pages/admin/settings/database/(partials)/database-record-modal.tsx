import Modal from "@moduletrace/twui/elements/Modal";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { DatabaseTableSummary } from "@/src/types";
import useDatabaseRecord from "../(hooks)/use-database-record";
import DatabaseRecordBody from "./database-record-body";

type Props = {
    table: DatabaseTableSummary;
    /**
     * The record being read, by its key; nothing while no record is open.
     */
    record_key: string | number | null;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * One record, whole: every column's value as its own block, in the order
 * the table declares them, so the text a cell cut at three lines can be
 * read to its end.
 */
export default function DatabaseRecordModal({ table, record_key, open, setOpen }: Props) {
    const { record, loading, error } = useDatabaseRecord({
        table: table.name,
        key: record_key ?? undefined,
        open,
    });

    return (
        <Modal open={open} setOpen={setOpen}>
            <Stack className="w-full items-stretch gap-5">
                <Stack className="gap-1 pr-10">
                    <Row className="gap-2! items-baseline">
                        <H3 className="font-mono">{table.name}</H3>
                        <Span size="smaller" variant="faded" className="font-mono">
                            {record_key === null ? "" : `key ${record_key}`}
                        </Span>
                    </Row>
                    <Span size="smaller" variant="faded">
                        {table.columns.length} column{table.columns.length == 1 ? "" : "s"}, read-only
                    </Span>
                </Stack>
                <DatabaseRecordBody table={table} record={record} loading={loading} error={error} />
            </Stack>
        </Modal>
    );
}
