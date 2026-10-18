import { twMerge } from "tailwind-merge";
import Span from "@moduletrace/twui/layout/Span";
import type { LogsTableColumn } from "../(data)/logs-table-columns";

export default function LogsTableHeadCell({
    title,
    className,
    hide_title,
}: LogsTableColumn) {
    return (
        <th className={twMerge("px-4 py-2.5 text-left font-medium", className)}>
            <Span size="smaller" variant="faded" className={twMerge(hide_title && "sr-only")}>
                {title}
            </Span>
        </th>
    );
}
