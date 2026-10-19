import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import type { BotMessageReaction } from "@/src/types";

type Props = BotMessageReaction & {
    onToggle: () => void;
};

/**
 * One emoji reaction under a message: its count, highlighted when the
 * user gave it. Clicking takes it back or adds it.
 */
export default function MessageReactionChip({ emoji, count, mine, onToggle }: Props) {
    return (
        <Button
            title={mine ? "Remove your reaction" : "Add this reaction"}
            aria-label={mine ? "Remove your reaction" : "Add this reaction"}
            aria-pressed={mine}
            type="button"
            variant="ghost"
            color="text"
            onClick={onToggle}
            className={`shrink-0 gap-1! px-2! py-0.5! rounded-default-lg border border-solid text-xs leading-4 ${
                mine
                    ? "border-hairline-strong bg-sunken text-ink"
                    : "border-hairline bg-surface text-ink-secondary hover:text-ink"
            } focus-visible:ring-2 focus-visible:ring-ink`}
        >
            <Span className="text-sm leading-4">{emoji}</Span>
            {count > 1 ? <Span className="tabular-nums">{count}</Span> : null}
        </Button>
    );
}
