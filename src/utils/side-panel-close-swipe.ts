export type SidePanelSide = "left" | "right";

type Params = {
    side: SidePanelSide;
};

/**
 * The swipe that closes a panel: back towards the edge it slid in from, so
 * the way it came. The rail slides in from the left and closes on a drag to
 * the left; the bot panel slides in from the right and closes on a drag to
 * the right. That is the opposite of the page swipe that opens each one.
 */
export default function sidePanelCloseSwipe({ side }: Params): "left" | "right" {
    return side == "left" ? "left" : "right";
}