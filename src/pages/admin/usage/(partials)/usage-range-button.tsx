import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";
import type { UsageRange } from "../(data)/usage-ranges";

type Props = {
    range: UsageRange;
    selected: boolean;
    loading?: boolean;
    onChange: (days: number) => void;
};

/**
 * One period of the range picker: ink-filled while it is the one showing,
 * quiet otherwise.
 */
export default function UsageRangeButton({ range, selected, loading, onChange }: Props) {
    return (
        <Button
            title={range.title}
            type="button"
            size="small"
            variant="ghost"
            color="text"
            aria-pressed={selected}
            disabled={loading && !selected}
            onClick={() => {
                if (!selected) onChange(range.days);
            }}
            className={twMerge(
                "px-2.5! py-1! text-[12px]! rounded-default-xs",
                selected
                    ? "bg-ink dark:bg-ink hover:bg-ink dark:hover:bg-ink text-on-ink dark:text-on-ink cursor-default"
                    : "text-ink-secondary dark:text-ink-secondary hover:bg-ink/5 dark:hover:bg-ink/5 hover:text-ink dark:hover:text-ink",
            )}
        >
            {range.title}
        </Button>
    );
}
