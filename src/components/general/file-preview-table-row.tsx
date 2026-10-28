import FilePreviewTableCell from "./file-preview-table-cell";

type Props = {
    cells: string[];
    header?: boolean;
};

/**
 * One row of a previewed CSV.
 */
export default function FilePreviewTableRow({ cells, header }: Props) {
    return (
        <tr>
            {cells.map((value, index) => (
                <FilePreviewTableCell key={index} value={value} header={header} />
            ))}
        </tr>
    );
}
