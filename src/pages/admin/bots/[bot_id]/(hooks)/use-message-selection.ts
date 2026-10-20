import { useEffect, useState, type RefObject } from "react";

/**
 * Text selected inside one message, and where it sits on screen.
 */
export type MessageSelection = {
    text: string;
    rect: DOMRect;
};

/**
 * Attribute on a message's text, marking what can be quoted.
 */
export const QuotableAttribute = "data-quotable";

type Params = {
    ref: RefObject<HTMLElement | null>;
};

/**
 * The text the user has selected in a message of the thread under `ref`,
 * or null. A selection that runs across messages, or out of the thread,
 * doesn't count.
 */
export default function useMessageSelection({ ref }: Params) {
    const [selection, setSelection] = useState<MessageSelection | null>(null);

    useEffect(() => {
        const read = () => {
            const picked = window.getSelection();
            const text = picked?.toString().trim() || "";

            if (!picked || picked.isCollapsed || !picked.rangeCount || !text) {
                setSelection(null);
                return;
            }

            const range = picked.getRangeAt(0);
            const quotable = (node: Node | null) =>
                (node instanceof Element ? node : node?.parentElement)?.closest(`[${QuotableAttribute}]`);
            const start = quotable(range.startContainer);

            if (!start || start != quotable(range.endContainer) || !ref.current?.contains(start)) {
                setSelection(null);
                return;
            }

            setSelection({ text, rect: range.getBoundingClientRect() });
        };

        document.addEventListener("selectionchange", read);
        ref.current?.addEventListener("scroll", read, { passive: true });

        const scroller = ref.current;

        return () => {
            document.removeEventListener("selectionchange", read);
            scroller?.removeEventListener("scroll", read);
        };
    }, [ref]);

    return {
        selection,
        clear: () => {
            window.getSelection()?.removeAllRanges();
            setSelection(null);
        },
    };
}
