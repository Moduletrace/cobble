import { useLayoutEffect, useRef } from "react";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import Button from "@moduletrace/twui/layout/Button";
import { Quote } from "lucide-react";
import type { MessageSelection } from "../(hooks)/use-message-selection";

type Props = {
    selection: MessageSelection;
    onQuote: () => void;
};

/**
 * "Quote", floating over text selected in a message: it puts the text in
 * the composer as a quote. Pressing it keeps the selection, so the text
 * it quotes is the one shown.
 */
export default function QuoteSelectionButton({ selection, onQuote }: Props) {
    const ref = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;

        if (!el) return;

        computePosition({ getBoundingClientRect: () => selection.rect }, el, {
            strategy: "fixed",
            placement: "top",
            middleware: [offset(8), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
        });
    }, [selection.rect]);

    return (
        <Button
            ref={ref}
            type="button"
            color="secondary"
            title="Quote in your message"
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onQuote}
            className="fixed left-0 top-0 z-50 gap-1.5! px-2.5! py-1.5! rounded-default-sm border border-solid border-hairline bg-surface shadow-popover text-xs font-bold text-ink hover:bg-sunken"
        >
            <Quote size={13} aria-hidden />
            Quote
        </Button>
    );
}
