import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Ellipsis } from "lucide-react";
import { AppData } from "@/src/data/app-data";
import type { BotWithLastMessage } from "@/src/types";
import RailSeeAllStone from "./rail-see-all-stone";

type Props = {
    /**
     * The bots the rail doesn't list.
     */
    hidden: BotWithLastMessage[];
    label: string;
    onOpen: () => void;
};

/**
 * Under the listed bots: a few stones of the ones that aren't listed and
 * "See all bots", which opens them all. An ellipsis when the rail
 * collapses.
 */
export default function RailSeeAllRow({ hidden, label, onOpen }: Props) {
    return (
        <Button
            title={label}
            type="button"
            variant="ghost"
            color="text"
            onClick={onOpen}
            className="flex shrink-0 h-10 w-full items-center justify-center lg:justify-start gap-3! rounded-default px-1! lg:px-3! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Ellipsis size={18} aria-hidden className="lg:hidden" />
            <Row className="hidden lg:flex shrink-0 gap-1! flex-nowrap items-center">
                {hidden.slice(0, AppData.RailSeeAllStones).map((bot) => (
                    <RailSeeAllStone key={bot.id} bot={bot} />
                ))}
            </Row>
            <Span className="hidden lg:inline text-[13px] font-bold leading-4">{label}</Span>
        </Button>
    );
}
