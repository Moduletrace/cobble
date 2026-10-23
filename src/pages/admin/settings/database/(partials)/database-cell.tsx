import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { DatabaseCell as DatabaseCellValue } from "@/src/types";

type Props = {
    cell?: DatabaseCellValue;
    /**
     * Whether the cell's record can be opened to read it whole.
     */
    openable: boolean;
    onOpen: () => void;
};

/**
 * One value in the records table, cut to three lines so a long column
 * can't push the rest of the row out of sight. Clicking it opens the
 * record in full.
 */
export default function DatabaseCell({ cell, openable, onOpen }: Props) {
    if (!cell || cell.kind == "null") {
        return (
            <td className="px-3 py-2.5 align-top">
                <Span size="smaller" variant="faded" className="font-mono">
                    NULL
                </Span>
            </td>
        );
    }

    return (
        <td className="px-3 py-2.5 align-top max-w-[280px]">
            <Span
                size="small"
                className={twMerge(
                    "block line-clamp-3 whitespace-pre-wrap break-words font-mono",
                    cell.kind == "number" ? "text-ink-secondary" : "text-ink",
                    cell.kind == "blob" && "text-ink-secondary",
                    openable && "cursor-pointer",
                )}
                onClick={openable ? onOpen : undefined}
                title={
                    openable
                        ? cell.truncated
                            ? "Cut short here: open the record to read the rest"
                            : "Open the record to read it whole"
                        : undefined
                }
            >
                {cell.text}
            </Span>
        </td>
    );
}
