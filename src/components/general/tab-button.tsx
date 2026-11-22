import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";

type Props = {
    title: string;
    active: boolean;
    onPick: () => void;
    className?: string;
};

/**
 * One tab in the app's small segmented row: a ghost button that sits on the
 * sunken surface while it is the one showing. The same tab the computer
 * viewer's modes use, so every segmented row in the app reads alike.
 */
export default function TabButton({ title, active, onPick, className }: Props) {
    return (
        <Button
            type="button"
            title={title}
            role="tab"
            aria-selected={active}
            variant="ghost"
            color="text"
            onClick={onPick}
            className={twMerge(
                "px-3! py-1.5! text-[13px] leading-[18px] rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink",
                active
                    ? "bg-sunken dark:bg-sunken text-ink dark:text-ink font-bold"
                    : "text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken",
                className,
            )}
        >
            {title}
        </Button>
    );
}