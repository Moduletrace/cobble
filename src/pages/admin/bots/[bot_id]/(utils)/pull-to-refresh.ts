/**
 * How far the finger must travel up the screen before the gesture counts as
 * a pull rather than a tap on the thread.
 */
export const PullToRefreshMinPx = 8;

/**
 * The room a full pull opens, in pixels: deep enough to show the reload
 * icon and no deeper, however far the drag goes. It is also the point at
 * which letting go reloads, so a thread only lifted a little, with nothing
 * but blank paper under it, is not a reload yet.
 */
export const PullToRefreshRoomPx = 64;

/**
 * How much of the finger's travel the pull shows: it resists, so a long
 * drag doesn't fling the indicator down the thread.
 */
export const PullToRefreshResistance = 0.6;

/**
 * The shortest the reloading icon stays up, in milliseconds: a reload the
 * server answers at once still says it happened, instead of flashing a
 * spinner nobody sees.
 */
export const PullToRefreshMinLoadingMs = 1000;

/**
 * How long a finger may rest before it moves and still count as a pull.
 * A press held first is a selection being made on a message, and the drag
 * that follows belongs to it; a drag that moves at once is a pull.
 */
export const PullToRefreshLongPressMs = 350;

/**
 * A pull up from the bottom of the thread, where nothing of the
 * conversation is left to scroll. Only upward travel counts, and only part
 * of it shows, up to the room the icon needs; `ready` says the room is as
 * deep as it opens, so letting go now reloads.
 */
export default function pullToRefreshState({
    start_y,
    current_y,
    resistance = PullToRefreshResistance,
}: {
    start_y: number;
    current_y: number;
    resistance?: number;
}) {
    const travel = Math.max(0, start_y - current_y);
    const distance = Math.min(travel * resistance, PullToRefreshRoomPx);

    return {
        distance,
        pulling: travel >= PullToRefreshMinPx,
        ready: distance >= PullToRefreshRoomPx,
    };
}