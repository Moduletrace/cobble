import { describe, expect, test } from "bun:test";
import pullGesture, {
    IdlePullGesture,
    type PullGesture,
    type PullGestureInput,
} from "./pull-to-refresh-gesture";

function run(
    inputs: PullGestureInput[],
    from: PullGesture = IdlePullGesture,
): PullGesture {
    return inputs.reduce(
        (gesture, input) => pullGesture({ gesture, input }).gesture,
        from,
    );
}

/** A finger on a thread already at its end, at `y`. */
const landedAtEnd = (y = 500): PullGestureInput => ({
    type: "start",
    y,
    at_end: true,
});

const climb = (y: number, at_end = true): PullGestureInput => ({
    type: "move",
    y,
    at_end,
});

const hold: PullGestureInput = { type: "hold" };
const release: PullGestureInput = { type: "end" };

describe("pullGesture", () => {
    test("a touch on a thread at its end pulls as the finger climbs", () => {
        const gesture = run([landedAtEnd(), climb(490)]);

        expect(gesture.engaged).toBe(true);
        expect(gesture.distance).toBe(6);
        expect(gesture.full).toBe(false);
    });

    test("the room stops at its full depth however far the drag goes", () => {
        const gesture = run([landedAtEnd(), climb(300)]);

        expect(gesture.distance).toBe(64);
        expect(gesture.full).toBe(true);
    });

    test("a touch on a thread with conversation left pulls nothing", () => {
        const gesture = run([
            { type: "start", y: 500, at_end: false },
            climb(300, false),
        ]);

        expect(gesture.engaged).toBe(false);
        expect(gesture.distance).toBe(0);
    });

    test("a swipe that runs out of conversation keeps going into the pull", () => {
        const at_end = run([
            { type: "start", y: 500, at_end: false },
            climb(400, false),
        ]);

        expect(at_end.engaged).toBe(false);
        expect(at_end.distance).toBe(0);

        const anchored = run([climb(380, true)], at_end);

        expect(anchored.anchor_y).toBe(380);
        expect(anchored.distance).toBe(0);
        expect(anchored.engaged).toBe(false);

        const pulling = run([climb(370, true)], anchored);

        expect(pulling.engaged).toBe(true);
        expect(pulling.distance).toBe(6);
    });

    test("a pull dragged back down closes the room and lifts again from the same anchor", () => {
        const down = run([landedAtEnd(), climb(400), climb(500)]);

        expect(down.anchor_y).toBe(500);
        expect(down.distance).toBe(0);
        expect(down.engaged).toBe(true);

        const up = run([climb(450)], down);

        expect(up.distance).toBe(30);
    });

    test("a move that finds conversation left gives the finger back", () => {
        const gesture = run([landedAtEnd(), climb(400), climb(420, false)]);

        expect(gesture.engaged).toBe(false);
        expect(gesture.distance).toBe(0);
        expect(gesture.anchor_y).toBeNull();
    });

    test("a moved thread can pull again later in the same gesture", () => {
        const gesture = run([
            landedAtEnd(),
            climb(400),
            climb(420, false),
            climb(400, true),
            climb(390, true),
        ]);

        expect(gesture.anchor_y).toBe(400);
        expect(gesture.engaged).toBe(true);
        expect(gesture.distance).toBe(6);
    });

    test("the hold only arms a room that is full", () => {
        const pulled = run([landedAtEnd(), climb(450)]);

        expect(pulled.full).toBe(false);
        expect(run([hold], pulled).armed).toBe(false);

        const full = run([landedAtEnd(), climb(300)]);

        expect(full.full).toBe(true);
        expect(run([hold], full).armed).toBe(true);
    });

    test("a hold that outlives the room closing does not reload", () => {
        const closed = run([landedAtEnd(), climb(300), hold, climb(480)]);

        expect(closed.full).toBe(false);
        expect(closed.armed).toBe(false);
        expect(run([hold], closed).armed).toBe(false);
        expect(
            pullGesture({ gesture: closed, input: release }).reload,
        ).toBe(false);
    });

    test("letting go of a full room before the hold reloads nothing", () => {
        const step = pullGesture({
            gesture: run([landedAtEnd(), climb(300)]),
            input: release,
        });

        expect(step.reload).toBe(false);
        expect(step.gesture).toEqual(IdlePullGesture);
    });

    test("letting go of a full room it held reloads", () => {
        const step = pullGesture({
            gesture: run([landedAtEnd(), climb(300), hold]),
            input: release,
        });

        expect(step.reload).toBe(true);
        expect(step.gesture).toEqual(IdlePullGesture);
    });

    test("a pull that was never the finger's reloads nothing however armed", () => {
        const step = pullGesture({
            gesture: { ...IdlePullGesture, armed: true, full: true },
            input: release,
        });

        expect(step.reload).toBe(false);
    });

    test("dropping the hold disarms the room", () => {
        const gesture = run([
            landedAtEnd(),
            climb(300),
            hold,
            { type: "drop_hold" },
        ]);

        expect(gesture.armed).toBe(false);
        expect(gesture.full).toBe(true);
    });

    test("a cancel clears the whole gesture", () => {
        const gesture = run([
            landedAtEnd(),
            climb(300),
            hold,
            { type: "cancel" },
        ]);

        expect(gesture).toEqual(IdlePullGesture);
    });

    test("moves without a finger on the thread change nothing", () => {
        expect(run([climb(300)])).toEqual(IdlePullGesture);
    });

    test("a touch that lifts without moving leaves the thread alone", () => {
        const step = pullGesture({ gesture: run([landedAtEnd()]), input: release });

        expect(step.gesture).toEqual(IdlePullGesture);
        expect(step.reload).toBe(false);
    });
});