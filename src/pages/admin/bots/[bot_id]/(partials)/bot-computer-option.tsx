import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Check } from "lucide-react";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";

type Props = {
    computer: BUN_SQLITE_COBBLE_COMPUTERS;
    /**
     * The computer the bot is on.
     */
    current: boolean;
    onPick: () => void;
};

/**
 * One computer in the header's computers modal, checked when it's the
 * one the bot is on.
 */
export default function BotComputerOption({ computer, current, onPick }: Props) {
    return (
        <Row
            role="radio"
            aria-checked={current}
            tabIndex={0}
            onClick={current ? undefined : onPick}
            onKeyDown={(e) => {
                if (!current && (e.key == "Enter" || e.key == " ")) {
                    e.preventDefault();
                    onPick();
                }
            }}
            className={`w-full min-h-9 gap-2.5! flex-nowrap items-center px-4 py-1.5 text-ink transition-colors duration-[var(--m-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink ${
                current ? "cursor-default" : "cursor-pointer hover:bg-sunken"
            }`}
        >
            <Check size={16} aria-hidden className={`shrink-0 ${current ? "" : "invisible"}`} />
            <Stack className="min-w-0 gap-0!">
                <Span className="text-sm leading-5 text-ink truncate w-full">
                    {computer.name || `Computer ${computer.id}`}
                </Span>
                {computer.description ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary truncate w-full">
                        {computer.description}
                    </Span>
                ) : null}
            </Stack>
        </Row>
    );
}
