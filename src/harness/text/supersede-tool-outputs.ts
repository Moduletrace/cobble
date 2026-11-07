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
 * Keeps only the newest page snapshot of each browser in a run's
 * transcript: a snapshot shows the page as it was, and the next one
 * replaces it, so resending the old ones on every turn only costs tokens.
 * Older ones become a note. A failed snapshot replaces nothing. Returns
 * how many were replaced.
 */
export default function supersedeToolOutputs({ transcript }: Params) {
    const names = new Map<string, string>();

    for (const message of transcript) {
        if (message.role != "assistant") continue;

        for (const call of message.tool_calls || []) names.set(call.id, call.name);
    }

    const newest = new Map<string, number>();

    transcript.forEach((message, index) => {
        if (message.role != "tool" || !isSnapshot({ message, names })) return;

        newest.set(names.get(message.tool_call_id)!, index);
    });

    let replaced = 0;

    transcript.forEach((message, index) => {
        if (message.role != "tool" || !isSnapshot({ message, names })) return;
        if (newest.get(names.get(message.tool_call_id)!) == index) return;

        transcript[index] = { ...message, content: SupersededSnapshotNote };
        replaced++;
    });

    return replaced;
}

/**
 * A successful snapshot that is still shown in full.
 */
function isSnapshot({ message, names }: { message: HarnessMessage & { role: "tool" }; names: Map<string, string> }) {
    const name = names.get(message.tool_call_id);

    return (
        Boolean(name) &&
        isBrowserTool({ name: name!, action: "browser_snapshot" }) &&
        !message.content.startsWith("Error:") &&
        message.content != SupersededSnapshotNote
    );
}
