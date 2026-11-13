import { AppData } from "@/src/data/app-data";

/**
 * A pull up from the bottom of the thread, where nothing of the
 * conversation is left to scroll. Only upward travel counts, and only part
 * of it shows, up to the room the icon needs; `ready` says the room is as
 * deep as it opens, which is where the hold that reloads begins.
 */
export default function pullToRefreshState({
    start_y,
    current_y,
    resistance = AppData.PullToRefreshResistance,
}: {
    start_y: number;
    current_y: number;
    resistance?: number;
}) {
    const travel = Math.max(0, start_y - current_y);
    const distance = Math.min(travel * resistance, AppData.PullToRefreshRoomPx);

    return {
        distance,
        pulling: travel >= AppData.PullToRefreshMinPx,
        ready: distance >= AppData.PullToRefreshRoomPx,
    };
}