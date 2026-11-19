import pullToRefreshState from "./pull-to-refresh";

/**
 * One finger's pull-to-reload gesture, as the thread reads it. Every step is
 * a plain function of the step before, so the whole gesture can be checked
 * without a browser.
 */
export type PullGesture = {
    /**
     * A finger is on the thread. The gesture ends only when it lifts, even
     * after the pull has given the finger back to the scroller.
     */
    touching: boolean;
    /**
     * Where the pull's travel is measured from: null until the thread is at
     * its end, then the finger's place at that moment.
     *
     * The anchor is what lets one continuous swipe hand over. A thumb that
     * starts halfway up the conversation and runs out of it scrolls until
     * the newest message reaches the bottom and then keeps going: fixing the
     * start at the touchstart alone meant such a swipe never pulled, since
     * the thread was not at its end yet when the finger landed.
     */
    anchor_y: number | null;
    /**
     * The pull is what the finger is doing. It stays the gesture's until the
     * finger lifts, or the thread has somewhere of its own to scroll again.
     */
    engaged: boolean;
    /** The room under the newest message is as deep as it opens. */
    full: boolean;
    /** The full room has been held long enough: letting go reloads. */
    armed: boolean;
    /** How far the content is lifted off the bottom, in pixels. */
    distance: number;
};

export const IdlePullGesture: PullGesture = {
    touching: false,
    anchor_y: null,
    engaged: false,
    full: false,
    armed: false,
    distance: 0,
};

export type PullGestureInput =
    | { type: "start"; y: number; at_end: boolean }
    | { type: "move"; y: number; at_end: boolean }
    | { type: "hold" }
    | { type: "drop_hold" }
    | { type: "end" }
    | { type: "cancel" };

export type PullGestureStep = {
    gesture: PullGesture;
    /** The finger lifted on a room it had held full: reload now. */
    reload: boolean;
};

export default function pullGesture({
    gesture,
    input,
}: {
    gesture: PullGesture;
    input: PullGestureInput;
}): PullGestureStep {
    switch (input.type) {
        case "start":
            return {
                gesture: {
                    ...IdlePullGesture,
                    touching: true,
                    anchor_y: input.at_end ? input.y : null,
                },
                reload: false,
            };

        case "move": {
            if (!gesture.touching) return { gesture, reload: false };

            /**
             * Not at the end: there is conversation left to scroll, so the
             * finger belongs to the scroller. A pull already begun goes back
             * down with it, and the anchor is taken again the next time the
             * thread reaches its end.
             */
            if (!input.at_end) {
                return {
                    gesture: {
                        ...gesture,
                        anchor_y: null,
                        engaged: false,
                        full: false,
                        armed: false,
                        distance: 0,
                    },
                    reload: false,
                };
            }

            const anchor_y = gesture.anchor_y ?? input.y;
            const pulled = pullToRefreshState({
                start_y: anchor_y,
                current_y: input.y,
            });

            return {
                gesture: {
                    ...gesture,
                    anchor_y,
                    engaged: gesture.engaged || pulled.pulling,
                    full: pulled.ready,
                    armed: pulled.ready && gesture.armed,
                    distance: pulled.distance,
                },
                reload: false,
            };
        }

        /**
         * The full room has been held long enough. It only arms while the
         * room is full: a hold that started on the way up must not reload
         * after the finger drifted back out of the room.
         */
        case "hold":
            return {
                gesture: { ...gesture, armed: gesture.full },
                reload: false,
            };

        case "drop_hold":
            return { gesture: { ...gesture, armed: false }, reload: false };

        case "end":
            return {
                gesture: IdlePullGesture,
                reload: gesture.engaged && gesture.armed,
            };

        case "cancel":
            return { gesture: IdlePullGesture, reload: false };
    }
}