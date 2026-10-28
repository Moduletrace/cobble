import { useMemo } from "react";
import P from "@moduletrace/twui/layout/P";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import parseCsv from "@/src/utils/parse-csv";
import FilePreviewNotice from "./file-preview-notice";
import FilePreviewTableRow from "./file-preview-table-row";

type Props = {
    text: string;
    delimiter: string;
};

/**
 * A CSV or TSV file as a table: its first row the header (kept in view
 * while scrolling), up to `AppData.FilePreviewMaxTableRows` rows. Cells
 * are text only. Tables have no children-based twui equivalent, so they're
 * styled elements, as in a message.
 */
export default function FilePreviewTable({ text, delimiter }: Props) {
    const { rows, truncated } = useMemo(
        () => parseCsv({ text, delimiter, max_rows: AppData.FilePreviewMaxTableRows + 1 }),
        [text, delimiter],
    );

    if (!rows.length) return <FilePreviewNotice message="This file is empty." />;

    const [header, ...body] = rows;

    return (
        <Stack className="grow min-h-0 w-full items-stretch gap-0!">
            <Stack className="grow min-h-0 w-full overflow-auto items-start">
                <table className="text-[13px] leading-5 text-ink border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-surface">
                        <FilePreviewTableRow cells={header!} header />
                    </thead>
                    <tbody>
                        {body.map((cells, index) => (
                            <FilePreviewTableRow key={index} cells={cells} />
                        ))}
                    </tbody>
                </table>
            </Stack>
            <P
                noMargin
                className="shrink-0 px-5 py-2 text-[12px] leading-4 text-ink-secondary border-0 border-t border-solid border-hairline"
            >
                {truncated
                    ? `Showing the first ${body.length} rows. Download the file for the rest.`
                    : `${body.length} ${body.length == 1 ? "row" : "rows"}`}
            </P>
        </Stack>
    );
}
