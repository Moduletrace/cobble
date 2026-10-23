import Loading from "@moduletrace/twui/elements/Loading";
import Pagination from "@moduletrace/twui/elements/Pagination";
import Center from "@moduletrace/twui/layout/Center";
import H2 from "@moduletrace/twui/layout/H2";
import Paper from "@moduletrace/twui/elements/Paper";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useState } from "react";
import type { DatabaseRecordsPayload, DatabaseSearchMode, DatabaseTableSummary } from "@/src/types";
import tableSummaryText from "../(functions)/table-summary-text";
import DatabaseRecordsTable from "./database-records-table";
import DatabaseRecordModal from "./database-record-modal";
import DatabaseSearchFields from "./database-search-fields";

type Props = {
    table: DatabaseTableSummary;
    records: DatabaseRecordsPayload | null;
    search: string;
    mode: DatabaseSearchMode;
    loading?: boolean;
    error?: string;
    onSubmitSearch: (search: string) => void;
    onChangeMode: (mode: DatabaseSearchMode) => void;
    onChangePage: (page: number) => void;
};

/**
 * The open table's records: what it holds, the search over it, the page of
 * records and the pager under them, each record opening whole in a modal.
 */
export default function DatabaseRecordsPane({
    table,
    records,
    search,
    mode,
    loading,
    error,
    onSubmitSearch,
    onChangeMode,
    onChangePage,
}: Props) {
    const [record_key, set_record_key] = useState<string | number | null>(null);
    const [modal_open, set_modal_open] = useState(false);

    const open_record = ({ key }: { key: string | number }) => {
        set_record_key(key);
        set_modal_open(true);
    };

    return (
        <Paper className="w-full xl:p-8 grow">
            <Stack className="grow min-w-0 w-full items-stretch">
                <Stack className="gap-1! items-stretch">
                    <H2 className="text-[18px]! leading-6 font-bold tracking-normal font-mono text-ink">{table.name}</H2>
                    <Span size="smaller" variant="faded">
                        {tableSummaryText({ table, records })}
                    </Span>
                </Stack>
                <DatabaseSearchFields
                    search={search}
                    mode={mode}
                    loading={loading}
                    onSubmit={onSubmitSearch}
                    onChangeMode={onChangeMode}
                />
                <Stack className="w-full mt-3 items-stretch">
                    <DatabaseRecordsBody
                        table={table}
                        records={records}
                        loading={loading}
                        error={error}
                        onOpenRecord={(key) => open_record({ key })}
                    />
                </Stack>
                {records && records.total > records.page_size ? (
                    <Pagination
                        count={records.total}
                        page={records.page}
                        setPage={(next) => {
                            const page = typeof next == "function" ? next(records.page) : next;
                            onChangePage(page);
                        }}
                        limit={records.page_size}
                        className="mt-4 w-full justify-center"
                    />
                ) : null}
            </Stack>
            <DatabaseRecordModal
                table={table}
                record_key={record_key}
                open={modal_open}
                setOpen={set_modal_open}
            />
        </Paper>
    );
}

type BodyProps = {
    table: DatabaseTableSummary;
    records: DatabaseRecordsPayload | null;
    loading?: boolean;
    error?: string;
    onOpenRecord: (key: string | number) => void;
};

/**
 * The page of records, or what stands in for it: loading, a refusal, or a
 * table with nothing (or nothing matching) in it.
 */
function DatabaseRecordsBody({ table, records, loading, error, onOpenRecord }: BodyProps) {
    if (error) {
        return (
            <Paper>
                <Center className="p-16">
                    <Span size="small">{error}</Span>
                </Center>
            </Paper>
        );
    }

    if (loading || !records) {
        return (
            <Paper>
                <Center className="p-16">
                    <Loading />
                </Center>
            </Paper>
        );
    }

    if (!records.records.length) {
        return (
            <Paper>
                <Center className="p-16">
                    <Stack className="items-center gap-1">
                        <Span size="small">
                            {records.search ? "Nothing in this table matches." : "This table is empty."}
                        </Span>
                        <Span size="smaller" variant="faded">
                            {records.search ? "Clear the search to see its records." : table.name}
                        </Span>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    return <DatabaseRecordsTable records={records} onOpenRecord={onOpenRecord} />;
}
