import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { Layers, Table2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import formatBytes from "@/src/utils/format-bytes";
import type { DatabaseTableSummary } from "@/src/types";
import databaseHref from "../(functions)/database-href";

type Props = {
    table: DatabaseTableSummary;
    selected: boolean;
    onOpen: () => void;
};

/**
 * One table in the database browser's picker: its name, what it holds and
 * what it takes on disk, with a virtual table's icon telling it apart from
 * the ordinary ones.
 */
export default function DatabaseTableRow({ table, selected, onOpen }: Props) {
    const Icon = table.type == "virtual" ? Layers : Table2;
    const rows = table.rows === null ? "-" : table.rows.toLocaleString();
    const size = table.size_bytes === null ? null : formatBytes({ bytes: table.size_bytes });

    return (
        <Link
            href={databaseHref({ table: table.name })}
            title={`${table.name}: ${rows} record${table.rows == 1 ? "" : "s"}${size ? `, ${size}` : ""}`}
            aria-current={selected ? "page" : undefined}
            onClick={(event) => {
                event.preventDefault();
                onOpen();
            }}
            className={twMerge(
                "flex w-full min-w-0 items-center gap-2 rounded-default px-2 py-1.5 border-0 text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <Span
                title={table.type == "virtual" ? "Virtual table" : "Table"}
                className="size-6 shrink-0 flex items-center justify-center rounded-default-sm bg-sunken text-ink-secondary"
            >
                <Icon size={14} aria-hidden />
            </Span>
            <Span className="min-w-0 flex-1 truncate font-mono text-[13px] leading-5">{table.name}</Span>
            <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">{rows}</Span>
        </Link>
    );
}
