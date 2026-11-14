import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import bubbleOverflows from "../(utils)/bubble-overflow";

type Params = {
    /**
     * The message's text: a different message is measured again and starts
     * closed.
     */
    text: string;
};

/**
 * Whether a user's own message is taller than the room it shows, and
 * whether the user opened the rest of it. A pasted prompt can run for
 * pages; the bubble cuts it, so it no longer pushes the conversation it
 * belongs to off the screen, and "Read more" opens the whole of it.
 * Measured in the browser only: the server has no layout, so the first
 * render shows the text cut and no button.
 */
export default function useBubbleClamp({ text }: Params) {
    const content_ref = useRef<HTMLDivElement | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflows, setOverflows] = useState(false);
    /** An opened message shows all of its text, so it has nothing to cut. */
    const open = useRef(false);

    open.current = expanded;

    const measure = useCallback(() => {
        const element = content_ref.current;

        if (!element || open.current) return;

        setOverflows(
            bubbleOverflows({
                scroll_height: element.scrollHeight,
                client_height: element.clientHeight,
            }),
        );
    }, []);

    useLayoutEffect(() => {
        setExpanded(false);
        setOverflows(false);
    }, [text]);

    /**
     * Measured before the first paint, so the button never lands after the
     * thread is already on screen, and again when the window (and with it
     * the bubble's width) changes.
     */
    useLayoutEffect(() => {
        const element = content_ref.current;

        if (!element) return;

        measure();

        if (typeof ResizeObserver == "undefined") return;

        const observer = new ResizeObserver(measure);

        observer.observe(element);

        return () => observer.disconnect();
    }, [measure, text, expanded]);

    return {
        content_ref: content_ref as RefObject<HTMLDivElement>,
        expanded,
        overflows,
        toggle: useCallback(() => setExpanded((value) => !value), []),
    };
}