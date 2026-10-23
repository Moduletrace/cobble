import Divider from "@moduletrace/twui/layout/Divider";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { DatabaseTableSummary } from "@/src/types";
import DatabaseTableRow from "./database-table-row";

type Props = {
    tables: DatabaseTableSummary[];
    /**
     * The table the browser is showing.
     */
    table: string;
    onOpenTable: (table: string) => void;
};

/**
 * Every table of the database, in one list beside the open one's records.
 * The record counts are the browser's first read, so the list already
 * says where the data sits before anything is clicked.
 */
export default function DatabaseTableList({ tables, table, onOpenTable }: Props) {
    return (
        <Stack className="w-full lg:w-[240px] shrink-0 items-stretch">
            <H2 className="mb-2 text-[18px]! leading-6 font-bold tracking-normal text-ink">Tables</H2>
            <Span className="mb-2 text-[13px] leading-[18px] text-ink-secondary">
                {tables.length} table{tables.length == 1 ? "" : "s"}
            </Span>
            <Divider />
            <Stack className="gap-0! items-stretch">
                {tables.map((entry) => (
                    <DatabaseTableRow
                        key={entry.name}
                        table={entry}
                        selected={entry.name == table}
                        onOpen={() => onOpenTable(entry.name)}
                    />
                ))}
            </Stack>
        </Stack>
    );
}
