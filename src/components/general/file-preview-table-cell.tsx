import { twMerge } from "tailwind-merge";

type Props = {
    value: string;
    header?: boolean;
};

/**
 * One cell of a previewed CSV, its text kept to one readable width.
 */
export default function FilePreviewTableCell({ value, header }: Props) {
    const className = twMerge(
        "px-3 py-1.5 max-w-80 text-left align-top whitespace-pre-wrap wrap-break-word border-0 border-b border-r border-solid border-hairline",
        header && "font-bold border-hairline-strong",
    );

    if (header) return <th className={className}>{value}</th>;

    return <td className={className}>{value}</td>;
}
