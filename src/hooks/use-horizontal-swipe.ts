"use client";

import { useEffect, useRef } from "react";
import { AppData } from "@/src/data/app-data";
import swipeGesture, {
    IdleSwipeGesture,
    type SwipeGesture,
} from "@/src/utils/swipe-gesture";
import touchInField from "@/src/utils/touch-in-field";

/**
 * Below this width the rail is a slide-over (Tailwind's `md`), so the
 * swipes that open it and the bot panel are the phone's alone: from `md` up
 * the rail is already inline and a mouse drag is selection.
 */
const PhoneMaxWidth = 768;

/**
 * What a touch on belongs to instead of the page: a panel the app slid in
 * itself. A field is `touchInField`.
 */
const OwnedTargets = "[data-no-swipe]";

type Params = {
    /**
     * False while a side panel is already open: a swipe on the open drawer
     * must not open the other one above it.
     */
    enabled: boolean;
    on_swipe_left: () => void;
    on_swipe_right: () => void;
};

/**
 * A touch that belongs to something other than the page: a field, a box
 * that scrolls sideways on its own (a wide code block, a table, a strip of
 * images), or anything inside a panel the app slid in.
 */
function ownsTouch({ target }: { target: EventTarget | null }): boolean {
    if (!(target instanceof Element)) return true;
    if (touchInField({ target })) return true;
    if (target.closest(OwnedTargets)) return true;

    for (let node: Element | null = target; node; node = node.parentElement) {
        const style = getComputedStyle(node);

        if (!/auto|scroll/.test(style.overflowX)) continue;
        if (node.scrollWidth > node.clientWidth + 2) return true;
    }

    return false;
}

/**
 * The phone's two sideways swipes, read anywhere on the page: a drag to the
 * right opens the rail's drawer, a drag to the left the bot panel. They are
 * flicks: a long drag, one that is mostly up or down, one that selects
 * text, one on a field or on something that scrolls sideways, and one
 * landing while a modal is up all belong to whatever they landed on, and
 * so do all the swipes while the drawer is open or the screen is wider
 * than a phone.
 *
 * The thresholds and the state machine live in `swipe-gesture.ts`, proven
 * without a browser; this reads the finger and calls back.
 */
export default function useHorizontalSwipe({
    enabled,
    on_swipe_left,
    on_swipe_right,
}: Params) {
    const on = useRef(enabled);
    const left = useRef(on_swipe_left);
    const right = useRef(on_swipe_right);

    on.current = enabled;
    left.current = on_swipe_left;
    right.current = on_swipe_right;

    useEffect(() => {
        let gesture: SwipeGesture = IdleSwipeGesture;
        let touched_at = 0;

        const restart = () => {
            gesture = IdleSwipeGesture;
        };

        const onStart = (event: TouchEvent) => {
            restart();

            if (!on.current) return;
            if (window.innerWidth >= PhoneMaxWidth) return;
            if (event.touches.length != 1) return;
            if (document.getElementById("twui-modal-root")?.childElementCount) return;
            if (ownsTouch({ target: event.target })) return;

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
             * A finger that has rested on the page is selecting text or
             * reaching for a quote, not changing panes.
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

            if (step.swipe == "right") right.current();
            if (step.swipe == "left") left.current();
        };

        window.addEventListener("touchstart", onStart, { passive: true });
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", restart);
        window.addEventListener("touchcancel", restart);

        return () => {
            window.removeEventListener("touchstart", onStart);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", restart);
            window.removeEventListener("touchcancel", restart);
        };
    }, []);
}