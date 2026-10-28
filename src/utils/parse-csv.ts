type Params = {
    text: string;
    /**
     * `,` for CSV, a tab for TSV.
     */
    delimiter?: string;
    /**
     * Stop after this many rows (the header included).
     */
    max_rows?: number;
};

export type ParsedCsv = {
    rows: string[][];
    /**
     * Rows were left out past `max_rows`.
     */
    truncated: boolean;
    /**
     * The widest row's cell count; every row is padded to it.
     */
    columns: number;
};

/**
 * Splits CSV text (RFC 4180: quoted cells may hold delimiters, line breaks
 * and doubled quotes) into rows of cells. A leading BOM is dropped, `\r\n`
 * and `\n` both end a row, a trailing empty line adds no row, and short
 * rows are padded so every row has the same number of cells.
 */
export default function parseCsv({ text, delimiter = ",", max_rows }: Params): ParsedCsv {
    const source = text.charCodeAt(0) == 0xfeff ? text.slice(1) : text;
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    let truncated = false;
    let index = 0;

    const endRow = () => {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
    };

    while (index < source.length) {
        const char = source[index]!;

        if (quoted) {
            if (char == '"') {
                if (source[index + 1] == '"') {
                    cell += '"';
                    index += 2;
                    continue;
                }

                quoted = false;
            } else {
                cell += char;
            }

            index++;
            continue;
        }

        if (char == '"' && cell == "") {
            quoted = true;
        } else if (char == delimiter) {
            row.push(cell);
            cell = "";
        } else if (char == "\n" || char == "\r") {
            if (char == "\r" && source[index + 1] == "\n") index++;

            endRow();

            if (max_rows && rows.length >= max_rows) {
                truncated = index + 1 < source.length;
                break;
            }
        } else {
            cell += char;
        }

        index++;
    }

    if (!truncated && (cell != "" || row.length)) endRow();

    const columns = rows.reduce((widest, it) => Math.max(widest, it.length), 0);

    for (const it of rows) {
        while (it.length < columns) it.push("");
    }

    return { rows, truncated, columns };
}
