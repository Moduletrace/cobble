import Divider from "@moduletrace/twui/layout/Divider";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import type { DatabaseCell, DatabaseTableColumn } from "@/src/types";

type Props = {
    column: DatabaseTableColumn;
    cell?: DatabaseCell;
};

/**
 * One column of an open record: its name and declared type, then its whole
 * value. Text keeps its own line breaks and wraps, so a stored JSON body or
 * a bot's message reads as it was written.
 */
export default function DatabaseRecordField({ column, cell }: Props) {
    const is_null = !cell || cell.kind == "null";

    return (
        <Stack className="w-full items-stretch gap-1 py-3">
            <Span size="smaller" variant="faded" className="font-mono">
                {`${column.name}${column.type ? ` (${column.type})` : ""}`}
            </Span>
            <Span
                size="small"
                className={twMerge(
                    "block font-mono break-words",
                    is_null ? "text-ink-disabled" : "text-ink whitespace-pre-wrap",
                )}
            >
                {is_null ? "NULL" : cell.text}
            </Span>
            <Divider />
        </Stack>
    );
}
