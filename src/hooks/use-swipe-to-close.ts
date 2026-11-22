"use client";

import { useEffect, useRef, type RefObject } from "react";
import { AppData } from "@/src/data/app-data";
import swipeGesture, {
    IdleSwipeGesture,
    type SwipeGesture,
} from "@/src/utils/swipe-gesture";
import touchInField from "@/src/utils/touch-in-field";

type Params = {
    /** The panel itself: only a finger that lands on it counts. */
    panel_ref: RefObject<HTMLElement | null>;
    /** Only while it is open; a panel that is closed keeps no listener. */
    enabled: boolean;
    /** The way back off the edge the panel slid in from. */
    direction: "left" | "right";
    on_close: () => void;
};

/**
 * Closes an open side panel with a phone swipe back towards the edge it slid
 * in from, where the page's own swipes are blocked on it (`data-no-swipe`).
 * It reads the finger on the panel alone, so the panel that is open is the
 * one that answers, and leaves the page's swipe hook to the page.
 *
 * The thresholds and the state machine are `swipe-gesture.ts`, the same ones
 * the page's swipes use: a flick, not a long drag, and one that is clearly
 * more sideways than up or down.
 */
export default function useSwipeToClose({
    panel_ref,
    enabled,
    direction,
    on_close,
}: Params) {
    const close = useRef(on_close);

    close.current = on_close;

    useEffect(() => {
        const panel = panel_ref.current;

        if (!panel || !enabled) return;

        let gesture: SwipeGesture = IdleSwipeGesture;
        let touched_at = 0;

        const restart = () => {
            gesture = IdleSwipeGesture;
        };

        const onStart = (event: TouchEvent) => {
            restart();

            if (event.touches.length != 1) return;
            if (document.getElementById("twui-modal-root")?.childElementCount) return;
            if (touchInField({ target: event.target })) return;

            const touch = event.touches[0];

            if (!touch) return;

            touched_at = Date.now();
            gesture = swipeGesture({
                gesture: IdleSwipeGesture,
                input: { type: "start", x: touch.clientX, y: touch.clientY },
            }).gesture;
        };

        const onMove = (event: TouchEvent) => {
            if (!gesture.touching) return;

            const touch = event.touches[0];

            if (!touch || event.touches.length != 1) {
                restart();
                return;
            }

            /**
             * A finger that has rested on the panel, or that is selecting
             * text, is reading it, not pushing it away.
             */
            if (Date.now() - touched_at > AppData.MobileSwipeMaxMs) {
                restart();
                return;
            }

            if (window.getSelection()?.toString()) {
                restart();
                return;
            }

            const step = swipeGesture({
                gesture,
                input: { type: "move", x: touch.clientX, y: touch.clientY },
            });

            gesture = step.gesture;

            if (step.swipe != direction) return;

            restart();
            close.current();
        };

        panel.addEventListener("touchstart", onStart, { passive: true });
        panel.addEventListener("touchmove", onMove, { passive: true });
        panel.addEventListener("touchend", restart);
        panel.addEventListener("touchcancel", restart);

        return () => {
            panel.removeEventListener("touchstart", onStart);
            panel.removeEventListener("touchmove", onMove);
            panel.removeEventListener("touchend", restart);
            panel.removeEventListener("touchcancel", restart);
        };
    }, [panel_ref, enabled, direction]);
}