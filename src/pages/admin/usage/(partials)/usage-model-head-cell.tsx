import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";

type Props = {
    title: string;
    className?: string;
};

/**
 * A column heading of the models table, right-aligned over its figures.
 */
export default function UsageModelHeadCell({ title, className }: Props) {
    return (
        <Span
            className={twMerge(
                "text-[11px] uppercase tracking-wide text-ink-secondary text-right truncate",
                className,
            )}
        >
            {title}
        </Span>
    );
}
