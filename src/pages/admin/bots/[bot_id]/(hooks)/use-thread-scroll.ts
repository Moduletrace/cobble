import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { BotMessageWithAttachments } from "@/src/types";
import {
    ThreadJumpWindowMs,
    scrollThreadToBottom,
    shouldFollowThread,
    threadOffset,
} from "../(utils)/thread-scroll";

type Params = {
    /**
     * The thread's messages, oldest first, pending ones included.
     */
    messages: BotMessageWithAttachments[];
};

/**
 * Keeps the thread's bottom in view: a chat sitting at the bottom follows
 * every new message, a chat scrolled up stays where it is (except for a
 * message the user just sent, which brings the thread to it) and offers a
 * button to get back down. Whether it sits at the bottom is read from where
 * the content ends, not from `scrollTop`, whose sign a reversed column
 * reports differently across engines. Content that grows while the thread
 * is at the bottom (images landing, a wider window) is followed too.
 */
export default function useThreadScroll({ messages }: Params) {
    const column_ref = useRef<HTMLDivElement>(null);
    const content_ref = useRef<HTMLDivElement>(null);
    const [jump_visible, setJumpVisible] = useState(false);
    /** Whether the bottom is being held, so nothing fights the user's scroll. */
    const following = useRef(true);
    /**
     * A pressed jump is still animating, so the scrolling it causes is its
     * own. It ends when the thread arrives, when a scroll moves away from
     * the bottom (the user took over), or after the window, whichever first.
     */
    const jump = useRef({ active: false, closest: 0, until: 0 });
    const previous = useRef<{
        last_id?: number | string | null;
        count: number;
    }>({ count: 0 });

    const measure = () => {
        const column = column_ref.current;
        const content = content_ref.current;

        if (!column || !content) return null;

        return threadOffset({
            content_bottom: content.getBoundingClientRect().bottom,
            column_bottom: column.getBoundingClientRect().bottom,
        });
    };

    /** The user's own scrolling: it decides whether the thread follows. */
    const onScroll = () => {
        const offset = measure();

        if (!offset) return;

        if (jump.current.active) {
            const animating =
                Date.now() < jump.current.until &&
                offset.distance <= jump.current.closest;

            jump.current.closest = offset.distance;
            jump.current.active = animating;

            if (animating) return;
        }

        following.current = offset.near_bottom;
        setJumpVisible(!offset.near_bottom);
    };

    const jumpToBottom = () => {
        const column = column_ref.current;

        if (!column) return;

        const reduced = Boolean(
            globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
        );

        jump.current = {
            active: !reduced,
            closest: Number.POSITIVE_INFINITY,
            until: Date.now() + ThreadJumpWindowMs,
        };
        following.current = true;
        setJumpVisible(false);

        scrollThreadToBottom({
            element: column,
            behavior: reduced ? "auto" : "smooth",
        });
    };

    useLayoutEffect(() => {
        const column = column_ref.current;
        const newest = messages[messages.length - 1];
        const before = previous.current;

        /**
         * The list was replaced (a new session, the first render) when the
         * message that was last is gone.
         */
        const kept_last_message =
            before.count > 0 &&
            messages.some((message) => message.id == before.last_id);

        previous.current = { last_id: newest?.id, count: messages.length };

        if (!column) return;

        const follow = shouldFollowThread({
            near_bottom: following.current,
            newest_author: newest?.author,
            kept_last_message,
        });

        if (!follow) {
            setJumpVisible(true);
            return;
        }

        following.current = true;
        jump.current.active = false;
        setJumpVisible(false);
        scrollThreadToBottom({ element: column });
    }, [messages]);

    useLayoutEffect(() => {
        const column = column_ref.current;
        const content = content_ref.current;

        if (!column || !content) return;

        /**
         * A message that grows after it lands (an image, a widened window)
         * keeps the bottom in view while the thread is there, and leaves a
         * chat scrolled up alone.
         */
        const observer = new ResizeObserver(() => {
            if (!following.current) return;

            scrollThreadToBottom({ element: column });
        });

        observer.observe(content);

        return () => observer.disconnect();
    }, []);

    return {
        column_ref,
        content_ref: content_ref as RefObject<HTMLDivElement>,
        jump_visible,
        jump_to_bottom: jumpToBottom,
        on_scroll: onScroll,
    };
}
