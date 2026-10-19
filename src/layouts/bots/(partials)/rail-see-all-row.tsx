import type { ReactNode } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Ellipsis } from "lucide-react";

type Props = {
    /**
     * A few of the records the rail doesn't list, e.g. their stones.
     */
    stones?: ReactNode;
    label: string;
    onOpen: () => void;
};

/**
 * Under the listed records: a few stones of the ones that aren't listed and
 * "See all", which opens every one in a modal. An ellipsis when the rail
 * collapses.
 */
export default function RailSeeAllRow({ stones, label, onOpen }: Props) {
    return (
        <Button
            title={label}
            type="button"
            variant="ghost"
            color="text"
            onClick={onOpen}
            className="flex shrink-0 h-10 w-full items-center justify-center @rail:justify-start gap-3! rounded-default px-1! @rail:px-3! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Ellipsis size={18} aria-hidden className="@rail:hidden" />
            {stones ? (
                <Row className="hidden @rail:flex shrink-0 gap-1! flex-nowrap items-center">{stones}</Row>
            ) : null}
            <Span className="hidden @rail:inline text-[13px] font-bold leading-4 truncate">{label}</Span>
        </Button>
    );
}
