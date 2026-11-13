"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import minimumWait from "../(utils)/minimum-wait";
import pullToRefreshState, {
    PullToRefreshLongPressMs,
    PullToRefreshMinLoadingMs,
} from "../(utils)/pull-to-refresh";

/**
 * What the pull indicator shows: nothing yet, a pull that isn't far
 * enough, one that will reload on release, or a reload in flight.
 */
export type PullToRefreshState = "idle" | "pulling" | "ready" | "refreshing";

type Params = {
    /**
     * The thread's scrolling column.
     */
    column_ref: RefObject<HTMLDivElement | null>;
    /**
     * The thread's content, which the pull moves up to open its room.
     */
    content_ref: RefObject<HTMLDivElement | null>;
    /**
     * Whether the thread's content ends at the column's bottom right now:
     * only there does pulling up have nothing left of the conversation to
     * scroll, so the pull belongs to the app.
     */
    at_bottom: () => boolean;
    /**
     * Reads the conversation again; the pull indicator stays up until it
     * finishes, and no less than a moment after.
     */
    on_refresh: () => Promise<void> | void;
};

/**
 * A phone gesture: touching the thread while it sits at its bottom and
 * dragging up lifts the newest message off the edge, opening room for a
 * refresh icon, since there is nothing newer to scroll to. Letting go once
 * the room is deep enough reads the conversation again.
 *
 * Touches are read rather than `scrollTop`, whose sign a reversed column
 * reports differently across engines. Once the pull has started it owns the
 * gesture until the finger lifts: it is not interrupted by a scroll, a
 * resize or a text selection, so a press that is still down always shows
 * its icon, and the reload happens on release, never before.
 *
 * The room is written straight onto the content as the finger moves, never
 * through a render: a phone drags in steps of a couple of pixels, and
 * re-rendering a long thread that often would cost more than the gesture is
 * worth. Only the icon's few states go through state.
 */
export default function usePullToRefresh({
    column_ref,
    content_ref,
    at_bottom,
    on_refresh,
}: Params) {
    const [state, setState] = useState<PullToRefreshState>("idle");
    const refresh = useRef(on_refresh);
    const bottom = useRef(at_bottom);

    refresh.current = on_refresh;
    bottom.current = at_bottom;

    useEffect(() => {
        const column = column_ref.current;
        const content = content_ref.current;

        if (!column) return;

        let start_y: number | null = null;
        let started_at = 0;
        /** The pull has begun: it runs to the release regardless. */
        let engaged = false;
        /** Letting go now reloads. */
        let armed = false;
        let busy = false;

        /**
         * The content is moved up, never resized: the thread follows its
         * content's size by jumping back to the bottom, and a padding that
         * grew under the finger would send it there mid-pull.
         */
        const setRoom = (distance: number) => {
            if (!content) return;

            content.style.transform = distance > 0 ? `translate3d(0, -${distance}px, 0)` : "";
        };

        /**
         * A drag over a message selects its text, in the emulated and real
         * touch alike, and the selection would grow while the thread is
         * lifted away from the finger. It is taken out of the way for the
         * length of a pull; a press that rested first never gets here.
         */
        const holdSelection = (held: boolean) => {
            if (!content) return;

            content.style.userSelect = held ? "none" : "";

            if (held) window.getSelection()?.removeAllRanges();
        };

        const reset = () => {
            start_y = null;
            started_at = 0;
            engaged = false;
            armed = false;
            setRoom(0);
            holdSelection(false);
            setState("idle");
        };

        const onStart = (event: TouchEvent) => {
            start_y = null;
            started_at = 0;
            engaged = false;
            armed = false;

            if (busy || event.touches.length != 1) return;
            if (!bottom.current()) return;

            start_y = event.touches[0]?.clientY ?? null;
            started_at = event.timeStamp;
        };

        const onMove = (event: TouchEvent) => {
            if (busy || start_y == null) return;

            const current_y = event.touches[0]?.clientY;

            if (current_y == undefined || event.touches.length != 1) {
                /**
                 * A move that arrives without its touch holds no finger
                 * position; the release's own event is on its way, and it
                 * is that one that decides.
                 */
                if (!event.touches.length) return;

                reset();
                return;
            }

            if (!engaged) {
                if (!bottom.current()) {
                    reset();
                    return;
                }

                /**
                 * A finger that rested before it moved was selecting, not
                 * pulling. A drag that moved at once is a pull, and any
                 * selection it started goes with it.
                 */
                const rested = event.timeStamp - started_at >= PullToRefreshLongPressMs;

                if (rested && window.getSelection()?.toString()) {
                    reset();
                    return;
                }

                if (pullToRefreshState({ start_y, current_y }).pulling) {
                    engaged = true;
                    holdSelection(true);
                }
            }

            /**
             * A finger dragged back down before it was let go takes the
             * room back down with it and hides the icon at the very travel
             * that showed it, so the pull reads the same in either
             * direction. The gesture stays its own until the release.
             */
            const pulled = pullToRefreshState({ start_y, current_y });

            armed = pulled.ready;
            setRoom(pulled.distance);
            setState(pulled.ready ? "ready" : pulled.pulling ? "pulling" : "idle");
        };

        const onEnd = async () => {
            if (busy) return;

            const reload = engaged && armed;

            start_y = null;
            started_at = 0;
            engaged = false;
            armed = false;

            if (!reload) {
                reset();
                return;
            }

            busy = true;
            /**
             * The room it was let go at stays open while it reloads, so
             * nothing moves under the finger that just lifted.
             */
            setState("refreshing");

            try {
                await minimumWait({
                    task: (async () => refresh.current())(),
                    minimum_ms: PullToRefreshMinLoadingMs,
                });
            } finally {
                busy = false;
                reset();
            }
        };

        column.addEventListener("touchstart", onStart, { passive: true });
        column.addEventListener("touchmove", onMove, { passive: true });
        column.addEventListener("touchend", onEnd);
        column.addEventListener("touchcancel", reset);

        return () => {
            column.removeEventListener("touchstart", onStart);
            column.removeEventListener("touchmove", onMove);
            column.removeEventListener("touchend", onEnd);
            column.removeEventListener("touchcancel", reset);
            setRoom(0);
            holdSelection(false);
        };
    }, [column_ref, content_ref]);

    return state;
}