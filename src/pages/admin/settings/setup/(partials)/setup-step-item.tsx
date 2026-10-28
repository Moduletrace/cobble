import { twMerge } from "tailwind-merge";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    number: number;
    current: boolean;
    done: boolean;
    onSelect: () => void;
};

/**
 * One step in the setup's trail: its number and name. Any step can be
 * opened, in any order.
 */
export default function SetupStepItem({ title, number, current, done, onSelect }: Props) {
    return (
        <Button
            title={`Step ${number}: ${title}`}
            type="button"
            variant="ghost"
            color="text"
            aria-current={current ? "step" : undefined}
            className={twMerge(
                "gap-2! px-2! py-1! rounded-default-sm text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken focus-visible:ring-2 focus-visible:ring-ink",
                current && "text-ink dark:text-ink font-bold",
            )}
            onClick={onSelect}
        >
            <Span
                className={twMerge(
                    "size-5 shrink-0 flex items-center justify-center rounded-full border border-solid border-hairline-strong text-[11px] leading-none",
                    (current || done) && "bg-ink text-on-ink border-ink",
                )}
            >
                {number}
            </Span>
            <Span className="text-[13px] leading-5">{title}</Span>
        </Button>
    );
}
