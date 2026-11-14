/**
 * How much taller a bubble's text may be than the room it shows before
 * it counts as cut: line heights and scroll sizes are rounded, and a
 * message that fits exactly must not offer "Read more".
 */
const OverflowSlackPx = 2;

type Params = {
    /**
     * The height the bubble's text would take uncut (`scrollHeight`).
     */
    scroll_height: number;
    /**
     * The height the bubble shows (`clientHeight`), cut to its lines.
     */
    client_height: number;
};

/**
 * Whether a user's own message needs cutting: its text is taller than the
 * room it shows, so "Read more" opens the rest.
 */
export default function bubbleOverflows({
    scroll_height,
    client_height,
}: Params) {
    return scroll_height - client_height > OverflowSlackPx;
}