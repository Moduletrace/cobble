import { browserSettleTimeoutNote } from "@/src/data/harness-prompts";
import isBrowserTool from "@/src/utils/browser-tool-name";

/**
 * Playwright's wording for an action that gave up on an element which never
 * stopped moving: the page animates, so the element is never "stable". Only
 * this one failure is worth a hint. A bad target or a missing element fails
 * with its own message, which already says what to fix.
 */
const SettleTimeout = /waiting for element to be visible, enabled and stable/i;

/**
 * What to add after a browser action that timed out waiting for its element
 * to settle, or nothing when the call did not fail that way. The run has
 * just spent 5 seconds on it, and retrying the same call is what one Canva
 * run did five times in a row.
 */
export default function browserRecoveryHint({ name, text }: { name: string; text: string }) {
    if (!isBrowserTool({ name })) return "";
    if (!text.startsWith("Error:")) return "";
    if (!SettleTimeout.test(text)) return "";

    return browserSettleTimeoutNote;
}