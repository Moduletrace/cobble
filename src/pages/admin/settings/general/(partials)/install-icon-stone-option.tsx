import Button from "@moduletrace/twui/layout/Button";
import Img from "@moduletrace/twui/layout/Img";
import { twMerge } from "tailwind-merge";
import type { BotHues } from "@/src/dict/bot-dict";

type Props = (typeof BotHues)[number] & {
    selected: boolean;
    onSelect: () => void;
};

/**
 * One stone to pick, drawn from its brand icon. Selected is a strong
 * border, never a colour change.
 */
export default function InstallIconStoneOption({ title, value, selected, onSelect }: Props) {
    return (
        <Button
            title={title}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={title}
            variant="ghost"
            color="gray"
            onClick={onSelect}
            className={twMerge(
                "size-12 p-2! rounded-default",
                "bg-surface dark:bg-surface hover:bg-sunken hover:dark:bg-sunken",
                "border border-solid border-hairline transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "border-ink dark:border-ink bg-ink/5 dark:bg-ink/5",
            )}
        >
            <Img src={`/brand/icons/${value}.svg`} alt="" className="size-full" />
        </Button>
    );
}
