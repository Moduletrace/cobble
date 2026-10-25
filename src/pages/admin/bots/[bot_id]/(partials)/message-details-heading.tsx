import Span from "@moduletrace/twui/layout/Span";

type Props = {
    children: string;
};

/**
 * The small label over each part of a message's details.
 */
export default function MessageDetailsHeading({ children }: Props) {
    return (
        <Span className="mt-4 mb-1 text-[11px] leading-4 font-bold uppercase tracking-wide text-ink-secondary">
            {children}
        </Span>
    );
}
