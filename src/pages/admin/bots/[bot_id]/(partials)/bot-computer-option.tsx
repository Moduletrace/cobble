import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppWindow, Check } from "lucide-react";
import { twMerge } from "tailwind-merge";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";

type Props = {
    computer: BUN_SQLITE_COBBLE_COMPUTERS;
    /**
     * The computer the bot is on.
     */
    current: boolean;
    /**
     * Whether picking another one moves the bot; without it the list is read
     * alone.
     */
    can_pick?: boolean;
    onPick: () => void;
    /**
     * Opens the computer in the viewer.
     */
    onOpen: () => void;
};

/**
 * One computer in the header's computers modal, checked when it's the
 * one the bot is on, with a button that opens it.
 */
export default function BotComputerOption({
    computer,
    current,
    can_pick = true,
    onPick,
    onOpen,
}: Props) {
    const name = computer.name || `Computer ${computer.id}`;

    return (
        <Row className="w-full gap-1! flex-nowrap items-center pr-2 hover:bg-sunken transition-colors duration-[var(--m-fast)]">
        <Row
            role={can_pick ? "radio" : undefined}
            aria-checked={can_pick ? current : undefined}
            tabIndex={can_pick ? 0 : undefined}
            onClick={can_pick && !current ? onPick : undefined}
            onKeyDown={(e) => {
                if (can_pick && !current && (e.key == "Enter" || e.key == " ")) {
                    e.preventDefault();
                    onPick();
                }
            }}
            className={twMerge(
                "grow min-w-0 min-h-9 gap-2.5! flex-nowrap items-center px-4 py-1.5 text-ink cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                can_pick && !current && "cursor-pointer"
            )}
        >
            <Check
                size={16}
                aria-hidden
                className={twMerge("shrink-0", !current && "invisible")}
            />
            <Stack className="min-w-0 gap-0!">
                <Span className="text-sm leading-5 text-ink truncate w-full">
                    {name}
                </Span>
                {computer.description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary truncate w-full">
                        {computer.description}
                    </Span>
                ) : null}
            </Stack>
        </Row>
        <Button
            type="button"
            variant="ghost"
            color="text"
            title={`Open ${name}`}
            aria-label={`Open ${name}`}
            onClick={onOpen}
            className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink rounded-default focus-visible:ring-2 focus-visible:ring-ink"
        >
            <AppWindow size={16} aria-hidden />
        </Button>
        </Row>
    );
}
