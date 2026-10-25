import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { InstallIconModes } from "../(data)/install-icon-modes";

type Props = (typeof InstallIconModes)[number] & {
    selected: boolean;
    onSelect: () => void;
};

/**
 * One radio tile, like the theme picker's: a strong border plus a check
 * when selected.
 */
export default function InstallIconModeOption({ title, description, Icon, selected, onSelect }: Props) {
    return (
        <Button
            title={title}
            type="button"
            role="radio"
            aria-checked={selected}
            variant="ghost"
            color="gray"
            onClick={onSelect}
            className={twMerge(
                "relative w-full min-w-0 h-auto p-4! pr-10! justify-start! rounded-default text-left",
                "bg-surface dark:bg-surface hover:bg-sunken hover:dark:bg-sunken text-ink dark:text-ink",
                "border border-solid border-hairline transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "border-ink dark:border-ink bg-ink/5 dark:bg-ink/5",
            )}
        >
            <Stack className="w-full min-w-0 gap-3! items-start">
                <Icon size={20} aria-hidden />
                <Stack className="w-full min-w-0 gap-0! items-start">
                    <Span className="text-sm font-bold leading-5 text-ink">{title}</Span>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">{description}</Span>
                </Stack>
            </Stack>
            {selected ? (
                <Span className="absolute top-3 right-3 size-5 rounded-full bg-ink text-on-ink flex items-center justify-center">
                    <Check size={12} strokeWidth={3} aria-hidden />
                </Span>
            ) : null}
        </Button>
    );
}
