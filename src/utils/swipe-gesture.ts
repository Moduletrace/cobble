import { AppData } from "@/src/data/app-data";

/**
 * The way one finger's drag across a page turned out: long enough
 * sideways, and clearly more sideways than up or down, is a swipe; long
 * enough up or down means the page's own scroll owns the gesture, and it
 * stays that way until the finger lifts.
 */
export type SwipeDirection = "left" | "right" | "vertical";

export type SwipeGesture = {
    /** A finger is down; nothing has been decided about its drag yet. */
    touching: boolean;
    start_x: number;
    start_y: number;
    /** What the drag is, once it has gone far enough to tell. */
    decided: SwipeDirection | null;
};

export type SwipeInput =
    | { type: "start"; x: number; y: number }
    | { type: "move"; x: number; y: number }
    | { type: "end" }
    | { type: "cancel" };

export type SwipeStep = {
    gesture: SwipeGesture;
    /** The swipe this move handed over, once per gesture; null otherwise. */
    swipe: "left" | "right" | null;
};

export const IdleSwipeGesture: SwipeGesture = {
    touching: false,
    start_x: 0,
    start_y: 0,
    decided: null,
};

type Params = {
    gesture: SwipeGesture;
    input: SwipeInput;
    min_px?: number;
    axis_ratio?: number;
};

/**
 * One step of a phone's sideways swipe, as a plain function so its cases
 * are proven without a browser. A drag decides once (`decided`): a swipe
 * fires on the move that made it, and further moves of the same finger
 * say nothing more.
 */
export default function swipeGesture({
    gesture,
    input,
    min_px = AppData.MobileSwipeMinPx,
    axis_ratio = AppData.MobileSwipeAxisRatio,
}: Params): SwipeStep {
    if (input.type == "start") {
        return {
            gesture: {
                touching: true,
                start_x: input.x,
                start_y: input.y,
                decided: null,
            },
            swipe: null,
        };
    }

    if (input.type == "end" || input.type == "cancel") {
        return { gesture: IdleSwipeGesture, swipe: null };
    }

    if (!gesture.touching || gesture.decided) {
        return { gesture, swipe: null };
    }

    const dx = input.x - gesture.start_x;
    const dy = input.y - gesture.start_y;
    const across = Math.abs(dx);
    const along = Math.abs(dy);

    if (across >= min_px && across >= along * axis_ratio) {
        const swipe = dx > 0 ? "right" : "left";

        return { gesture: { ...gesture, decided: swipe }, swipe };
    }

    /**
     * A drag that is mostly up or down is the page's scroll: it stays
     * un-decided as a swipe even if it later drifts sideways.
     */
    if (along >= min_px && along > across) {
        return { gesture: { ...gesture, decided: "vertical" }, swipe: null };
    }

    return { gesture, swipe: null };
}