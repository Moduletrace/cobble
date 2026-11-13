import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";

type Props = {
    label: string;
    text: string;
    /**
     * Code is kept as written (indentation and all), in a monospaced face.
     */
    code?: boolean;
};

/**
 * One labelled part of a step in the debug logs' hover card: what it
 * reasoned, what it was sent, what it answered. Never cut: the card scrolls
 * instead.
 */
export default function TraceHoverSection({ label, text, code }: Props) {
    return (
        <Stack className="w-full gap-0.5! items-stretch">
            <Span className="text-[10px] leading-3 uppercase tracking-wide text-ink-secondary">{label}</Span>
            <Span
                className={twMerge(
                    "w-full whitespace-pre-wrap break-words text-[11.5px] leading-4 text-ink",
                    code && "font-mono",
                )}
            >
                {text}
            </Span>
        </Stack>
    );
}