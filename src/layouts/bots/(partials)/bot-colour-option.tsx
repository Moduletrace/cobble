import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import BotStone from "@/src/components/general/bot-stone";
import type { BotHues } from "@/src/dict/bot-dict";

type Props = (typeof BotHues)[number] & {
    selected: boolean;
    disabled?: boolean;
    onSelect: () => void;
};

/**
 * One colour tile: a stone in that hue over its name. Selected is a strong
 * border, so it never depends on the colour alone.
 */
export default function BotColourOption({ title, value, color, selected, disabled, onSelect }: Props) {
    return (
        <Button
            title={title}
            type="button"
            role="radio"
            aria-checked={selected}
            variant="ghost"
            color="gray"
            disabled={disabled}
            onClick={onSelect}
            className={twMerge(
                "w-full min-w-0 h-auto px-1! py-2! rounded-default",
                "bg-surface dark:bg-surface hover:bg-sunken hover:dark:bg-sunken text-ink dark:text-ink",
                "border border-solid border-hairline transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "border-ink dark:border-ink bg-ink/5 dark:bg-ink/5",
            )}
        >
            <Stack className="w-full min-w-0 gap-1! items-center">
                <BotStone
                    color={color}
                    stone={value}
                    face={selected ? "done" : "idle"}
                    size={28}
                />
                <Span
                    className={twMerge(
                        "text-xs leading-4 text-ink-secondary truncate",
                        selected && "font-bold text-ink",
                    )}
                >
                    {title}
                </Span>
            </Stack>
        </Button>
    );
}
