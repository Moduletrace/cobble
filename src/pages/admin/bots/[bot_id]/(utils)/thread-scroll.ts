import { AppData } from "@/src/data/app-data";

/**
 * Pixels from the bottom that still count as being at it, so a mouse wheel
 * tick or a rounding difference doesn't hide the latest message.
 */
export const ThreadBottomSlack = 48;

/**
 * How long a smooth jump to the bottom runs, in milliseconds. The scrolling
 * it causes is ignored for that long (so the button doesn't flicker back
 * mid-animation), and the window ends on its own however it lands.
 */
export const ThreadJumpWindowMs = 800;

/**
 * How far the thread's content sits below the bottom of its column, in
 * pixels, and whether that still counts as being at the bottom. It reads
 * the two rects rather than `scrollTop`, whose sign a reversed column
 * (`flex-col-reverse`) reports differently across engines: the content's
 * bottom edge is the column's when the thread is at its bottom, and past it
 * by however far the thread has been scrolled up.
 */
export function threadOffset({
    content_bottom,
    column_bottom,
    slack = ThreadBottomSlack,
}: {
    content_bottom: number;
    column_bottom: number;
    slack?: number;
}) {
    const distance = content_bottom - column_bottom;
    const at_bottom = distance <= slack;

    return {
        distance: at_bottom && distance < 0 ? 0 : distance,
        near_bottom: at_bottom,
    };
}

/**
 * Whether the thread's content ends as far down as it goes, for the pull
 * that opens room under the newest message. It is stricter than
 * `threadOffset`'s `near_bottom`, which lets a wheel tick or a rounding
 * difference pass so the newest message stays in view: a pull needs the
 * content to have nowhere left of its own to scroll, or the finger's travel
 * would be the scroller's.
 *
 * It still keeps a couple of pixels of slack. A phone's fractional device
 * pixel ratio leaves the content a fraction of a pixel past the column's
 * edge while a reversed column sits at its end, and a thumb that comes to
 * rest a pixel above the newest message is at the bottom by any reading.
 * Demanding an exact zero there made the gesture do nothing at all, with no
 * hint why.
 */
export function atThreadEnd({
    distance,
    slack = AppData.PullToRefreshEndSlackPx,
}: {
    distance: number;
    slack?: number;
}) {
    return distance <= slack;
}

/**
 * Whether the thread should show a change of its messages, which keeps the
 * bottom in view while the user is there: it follows while at the bottom, a
 * message the user sent always counts, and a list that replaced the old one
 * (a new session, a first render) opens at its bottom. A chat scrolled up
 * stays where it is when a bot answers.
 */
export function shouldFollowThread({
    near_bottom,
    newest_author,
    kept_last_message,
}: {
    near_bottom: boolean;
    newest_author?: string | null;
    kept_last_message: boolean;
}) {
    if (!kept_last_message) return true;
    if (newest_author == "user") return true;

    return near_bottom;
}

/**
 * Puts the thread at its bottom, animated or at once. A reversed column
 * clamps a past-the-end `scrollTop` back onto its bottom, so the same call
 * serves either direction.
 */
export function scrollThreadToBottom({
    element,
    behavior = "auto",
}: {
    element: HTMLElement;
    behavior?: ScrollBehavior;
}) {
    element.scrollTo({ top: element.scrollHeight, behavior });
}
