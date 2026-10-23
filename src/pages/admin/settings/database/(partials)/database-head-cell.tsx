import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    /**
     * What the column is, its declared type, shown on hover so the head
     * stays one line of names.
     */
    hint?: string;
};

/**
 * One column name over the records table. Column names are read as code:
 * the database wrote them, nobody typed them.
 */
export default function DatabaseHeadCell({ title, hint }: Props) {
    return (
        <th className="px-3 py-2.5 text-left font-medium max-w-[280px]">
            <Span size="smaller" variant="faded" className="block truncate font-mono" title={hint || title}>
                {title}
            </Span>
        </th>
    );
}
