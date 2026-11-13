import type { ToolRollupEntry } from "@/src/utils/tool-rollup";
import toolRollup from "@/src/utils/tool-rollup";
import MessageDetailRow from "./message-detail-row";
import MessageDetailsHeading from "./message-details-heading";
import MessageToolRow from "./message-tool-row";

type Props = {
    /**
     * The message's `tool_log` (`{ name, ok }` per call).
     */
    tool_log?: string | null;
};

/**
 * What a message's run actually did, by tool: the one reading that tells a
 * run which worked from one that spent 242 model calls and changed
 * nothing. The app's own record (`bot_messages.tool_log`), so it can't
 * claim work the run didn't make.
 */
export default function MessageToolsRollup({ tool_log }: Props) {
    const rollup = toolRollup({ tool_log });

    if (!rollup || !rollup.tools.length) return null;

    return (
        <>
            <MessageDetailsHeading>Tools used</MessageDetailsHeading>
            <MessageDetailRow
                label="Tool calls"
                value={rollup.failed ? `${rollup.calls} (${rollup.failed} failed)` : String(rollup.calls)}
            />
            {rollup.tools.map((tool: ToolRollupEntry) => (
                <MessageToolRow key={tool.name} tool={tool} />
            ))}
        </>
    );
}