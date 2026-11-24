import { browserBridgeNote, browserSettleTimeoutNote } from "@/src/data/harness-prompts";
import isBrowserTool from "@/src/utils/browser-tool-name";
import isLostMcpSession from "../../mcp/is-lost-mcp-session";

/**
 * Playwright's wording for an action that gave up on an element which never
 * stopped moving: the page animates, so the element is never "stable". Only
 * this one failure is worth a hint. A bad target or a missing element fails
 * with its own message, which already says what to fix.
 */
const SettleTimeout = /waiting for element to be visible, enabled and stable/i;

/**
 * What to add to a browser tool's error, or nothing when the call failed
 * for a reason the error already explains (a bad target, a missing
 * element). Two failures say more than the error itself:
 *
 * - the element never settled, so retrying it is what one Canva run did
 *   five times in a row;
 * - the connection to the computer's browser bridge is gone, which is the
 *   computer's to fix, not the run's (`browserBridgeNote`).
 *
 * Applied where tool errors become the model's text (`run-tool-call`): a
 * result the server flags as an error is thrown, so a wrapper around a
 * successful result never sees it.
 */
export default function browserRecoveryHint({ name, text }: { name: string; text: string }) {
    if (!isBrowserTool({ name })) return "";
    if (!text.startsWith("Error:")) return "";
    if (SettleTimeout.test(text)) return browserSettleTimeoutNote;
    if (isLostMcpSession({ text })) return browserBridgeNote;

    return "";
}
