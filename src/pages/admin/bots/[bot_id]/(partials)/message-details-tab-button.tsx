import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";

type Props = {
    label: string;
    selected: boolean;
    onSelect: () => void;
};

/**
 * One tab of a message's Details modal: ink-filled while it is the one
 * showing, quiet otherwise (the way the usage page's range buttons read as
 * pressed), so the active tab is readable in both themes.
 */
export default function MessageDetailsTabButton({ label, selected, onSelect }: Props) {
    return (
        <Button
            title={label}
            type="button"
            size="small"
            variant="ghost"
            color="text"
            aria-pressed={selected}
            onClick={() => {
                if (!selected) onSelect();
            }}
            className={twMerge(
                "px-2.5! py-1! text-[12px]! rounded-default-xs",
                selected
                    ? "bg-ink dark:bg-ink hover:bg-ink dark:hover:bg-ink text-on-ink dark:text-on-ink cursor-default"
                    : "text-ink-secondary dark:text-ink-secondary hover:bg-ink/5 dark:hover:bg-ink/5 hover:text-ink dark:hover:text-ink",
            )}
        >
            {label}
        </Button>
    );
}