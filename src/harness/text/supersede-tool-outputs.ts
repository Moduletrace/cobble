import { SupersededSnapshotNote } from "@/src/data/harness-prompts";
import isBrowserTool from "@/src/utils/browser-tool-name";
import type { HarnessMessage } from "../types";

type Params = {
    /**
     * Changed in place, so the run keeps the savings.
     */
    transcript: HarnessMessage[];
};

/**
 * Keeps only the newest page reading of each kind and browser in a run's
 * transcript: a snapshot or a find shows the page as it was, and the next
 * one of the same kind replaces it, so resending the old ones on every turn
 * only costs tokens. Older ones become a note. A failed call replaces
 * nothing. Returns how many were replaced.
 */
export default function supersedeToolOutputs({ transcript }: Params) {
    const names = new Map<string, string>();

    for (const message of transcript) {
        if (message.role != "assistant") continue;

        for (const call of message.tool_calls || []) names.set(call.id, call.name);
    }

    const newest = new Map<string, number>();

    transcript.forEach((message, index) => {
        if (message.role != "tool" || !isPageState({ message, names })) return;

        newest.set(names.get(message.tool_call_id)!, index);
    });

    let replaced = 0;

    transcript.forEach((message, index) => {
        if (message.role != "tool" || !isPageState({ message, names })) return;
        if (newest.get(names.get(message.tool_call_id)!) == index) return;

        transcript[index] = { ...message, content: SupersededSnapshotNote };
        replaced++;
    });

    return replaced;
}

/**
 * Playwright MCP's readings of the page itself: a snapshot's whole tree and
 * a find's matches. Both are the page as it was when the call ran, both are
 * large, and both go stale at the next action, so only the newest of each
 * kind is worth resending. Ten find results stayed in a Canva run's
 * transcript for the rest of its 58 turns, since nothing replaced them
 * (Nov 2026).
 */
const PageStateActions = ["browser_snapshot", "browser_find"];

/**
 * A successful page reading that is still shown in full.
 */
function isPageState({ message, names }: { message: HarnessMessage & { role: "tool" }; names: Map<string, string> }) {
    const name = names.get(message.tool_call_id);

    return (
        Boolean(name) &&
        PageStateActions.some((action) => isBrowserTool({ name: name!, action })) &&
        !message.content.startsWith("Error:") &&
        message.content != SupersededSnapshotNote
    );
}
