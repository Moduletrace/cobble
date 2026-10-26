import type { ShownSession } from "@/src/types";

export const ShownSessionEvent = "cobble:session-shown";

/**
 * The last session a conversation page showed, for a rail list that
 * mounts after the page told it.
 */
export let lastShownSession: ShownSession | null = null;

/**
 * Tells the rail which session the conversation page shows, once its
 * history loads (`useShownSession`).
 */
export default function announceShownSession(shown: ShownSession) {
    lastShownSession = shown;
    window.dispatchEvent(new CustomEvent(ShownSessionEvent, { detail: shown }));
}
