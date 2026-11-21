/**
 * The event the conversation listens for when Plan mode should go off
 * without the user pressing Tab or the composer button: a plan they
 * approved is about to work, and its steps write.
 */
export const PlanModeOffEvent = "cobble:plan-mode-off";

type Params = {
    /**
     * Where to announce it: the page's window, or a target in a test.
     */
    target?: EventTarget | null;
};

/**
 * Tells the open conversation that Plan mode is over, so its header tag,
 * notice and next message all follow. Approving a plan is the user asking
 * for the work to start, which Plan mode would otherwise contradict.
 */
export default function announcePlanModeOff({
    target = typeof window == "undefined" ? null : window,
}: Params = {}) {
    target?.dispatchEvent(new Event(PlanModeOffEvent));
}