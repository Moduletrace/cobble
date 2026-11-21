import { describe, expect, test } from "bun:test";
import swipeGesture, { IdleSwipeGesture, type SwipeGesture } from "./swipe-gesture";

function started({ x = 0, y = 0 }: { x?: number; y?: number } = {}): SwipeGesture {
    return swipeGesture({ gesture: IdleSwipeGesture, input: { type: "start", x, y } }).gesture;
}

function dragged({ gesture, x, y }: { gesture: SwipeGesture; x: number; y: number }) {
    return swipeGesture({ gesture, input: { type: "move", x, y } });
}

describe("swipeGesture", () => {
    test("says nothing before a finger is down", () => {
        expect(swipeGesture({ gesture: IdleSwipeGesture, input: { type: "move", x: 200, y: 0 } })).toEqual({
            gesture: IdleSwipeGesture,
            swipe: null,
        });
    });

    test("a short drag decides nothing", () => {
        const step = dragged({ gesture: started(), x: 20, y: 5 });

        expect(step.swipe).toBeNull();
        expect(step.gesture.decided).toBeNull();
        expect(step.gesture.touching).toBe(true);
    });

    test("a drag far enough sideways is a swipe to that side", () => {
        const right = dragged({ gesture: started(), x: 60, y: 10 });
        expect(right.swipe).toBe("right");

        const left = dragged({ gesture: started({ x: 300 }), x: 240, y: 10 });
        expect(left.swipe).toBe("left");
    });

    test("a swipe fires on the exact minimum and not a pixel short of it", () => {
        expect(dragged({ gesture: started(), x: 49, y: 0 }).swipe).toBeNull();
        expect(dragged({ gesture: started(), x: 50, y: 0 }).swipe).toBe("right");
    });

    test("a drag that is mostly up or down locks the gesture to scrolling", () => {
        const step = dragged({ gesture: started(), x: 5, y: 60 });

        expect(step.swipe).toBeNull();
        expect(step.gesture.decided).toBe("vertical");
    });

    test("a scroll never becomes a swipe, however far the finger drifts sideways afterwards", () => {
        const scroll = dragged({ gesture: started(), x: 5, y: 60 }).gesture;
        const drift = dragged({ gesture: scroll, x: 300, y: 70 });

        expect(drift.swipe).toBeNull();
        expect(drift.gesture.decided).toBe("vertical");
    });

    test("a diagonal drag waits until one direction clearly wins", () => {
        const diagonal = dragged({ gesture: started(), x: 40, y: 45 });
        expect(diagonal.swipe).toBeNull();
        expect(diagonal.gesture.decided).toBeNull();

        const resolved = dragged({ gesture: diagonal.gesture, x: 90, y: 50 });
        expect(resolved.swipe).toBe("right");
    });

    test("a drag as far sideways as it is long fires no swipe", () => {
        const step = dragged({ gesture: started(), x: 60, y: 50 });

        expect(step.swipe).toBeNull();
        expect(step.gesture.decided).toBeNull();
    });

    test("fires once: the rest of the finger's travel says nothing", () => {
        const swiped = dragged({ gesture: started(), x: 80, y: 0 });
        expect(swiped.swipe).toBe("right");

        const further = dragged({ gesture: swiped.gesture, x: 200, y: 0 });
        expect(further.swipe).toBeNull();
        expect(further.gesture.decided).toBe("right");
    });

    test("lifting the finger starts over", () => {
        const swiped = dragged({ gesture: started(), x: 80, y: 0 }).gesture;
        const ended = swipeGesture({ gesture: swiped, input: { type: "end" } });

        expect(ended.gesture).toEqual(IdleSwipeGesture);
        expect(dragged({ gesture: ended.gesture, x: 200, y: 0 }).swipe).toBeNull();
    });

    test("a cancelled touch starts over too", () => {
        const scroll = dragged({ gesture: started(), x: 0, y: 90 }).gesture;

        expect(
            swipeGesture({ gesture: scroll, input: { type: "cancel" } }).gesture,
        ).toEqual(IdleSwipeGesture);
    });

    test("the thresholds are the caller's to set", () => {
        const step = swipeGesture({
            gesture: started(),
            input: { type: "move", x: 20, y: 2 },
            min_px: 10,
            axis_ratio: 1.2,
        });

        expect(step.swipe).toBe("right");
    });
});