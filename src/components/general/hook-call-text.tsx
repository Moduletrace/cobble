import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";

type Props = {
    label: string;
    text: string;
    /**
     * A preview is kept short; the whole call shows everything.
     */
    full?: boolean;
};

/**
 * One side of a hook call, what it sent or what its run answered, in a
 * sunken block.
 */
export default function HookCallText({ label, text, full }: Props) {
    return (
        <Stack className="w-full gap-0.5! items-stretch">
            <Span className="text-[11px] leading-4 text-ink-secondary">{label}</Span>
            <Span
                className={twMerge(
                    "block w-full overflow-hidden whitespace-pre-wrap break-all rounded-default-xs bg-sunken px-2 py-1 font-mono text-[12px] leading-4 text-ink-secondary",
                    full ? "max-h-80 overflow-y-auto" : "max-h-24",
                )}
            >
                {text}
            </Span>
        </Stack>
    );
}
