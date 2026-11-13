"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AppData } from "@/src/data/app-data";
import minimumWait from "../(utils)/minimum-wait";
import pullToRefreshState from "../(utils)/pull-to-refresh";
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
 * refresh icon, since there is nothing newer to scroll to. Once the room is
 * as deep as it opens, the finger has to stay there for a moment before
 * letting go reloads: a thread whose scroll is already exhausted opens its
 * limit easily by accident, and the hold is what says the reload was meant.
 * The icon lights up when it is, and a release before that closes the room
 * and reloads nothing.
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
        /** The pull has begun: it runs to the release regardless. */
        let engaged = false;
        /** The room has stayed full long enough: letting go now reloads. */
        let armed = false;
        /** When the room last became full, while the finger holds it there. */
        let held_since: number | null = null;
        let held_timer: ReturnType<typeof setTimeout> | null = null;
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
         * lifted away from the finger. It is taken out of the way once a
         * pull has begun, since the pull is what this finger is doing.
         */
        const holdSelection = (held: boolean) => {
            if (!content) return;

            content.style.userSelect = held ? "none" : "";

            if (held) window.getSelection()?.removeAllRanges();
        };

        /**
         * The room is full: the hold that makes it a reload starts, or is
         * already running. A finger that rests on the limit fires no further
         * touches, so the timer is what notices the hold, not the moves.
         */
        const beginHold = () => {
            if (held_since != null) return;

            held_since = Date.now();
            held_timer = setTimeout(() => {
                held_timer = null;

                if (held_since == null) return;

                armed = true;
                setState("ready");
            }, AppData.PullToRefreshHoldMs);
        };

        /** Not full any more: the hold starts again from nothing. */
        const dropHold = () => {
            held_since = null;
            armed = false;

            if (held_timer == null) return;

            clearTimeout(held_timer);
            held_timer = null;
        };

        const reset = () => {
            start_y = null;
            engaged = false;
            dropHold();
            setRoom(0);
            holdSelection(false);
            setState("idle");
        };

        const onStart = (event: TouchEvent) => {
            start_y = null;
            engaged = false;
            dropHold();

            if (busy || event.touches.length != 1) return;
            if (!bottom.current()) return;

            start_y = event.touches[0]?.clientY ?? null;
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

                if (pullToRefreshState({ start_y, current_y }).pulling) {
                    engaged = true;
                    holdSelection(true);
                }
            }

            /**
             * A finger dragged back down before it was let go takes the
             * room back down with it and hides the icon at the very travel
             * that showed it, so the pull reads the same in either
             * direction. The gesture stays its own until the release, and
             * a hold that has not finished yet starts over from nothing.
             */
            const pulled = pullToRefreshState({ start_y, current_y });

            if (pulled.ready) beginHold();
            else dropHold();

            setRoom(pulled.distance);
            setState(armed ? "ready" : pulled.pulling ? "pulling" : "idle");
        };

        const onEnd = async () => {
            if (busy) return;

            const reload = engaged && armed;

            start_y = null;
            engaged = false;
            dropHold();

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
                    minimum_ms: AppData.PullToRefreshMinLoadingMs,
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
            dropHold();
            setRoom(0);
            holdSelection(false);
        };
    }, [column_ref, content_ref]);

    return state;
}