import Span from "@moduletrace/twui/layout/Span";
import { AppData } from "@/src/data/app-data";
import type { BotMessageWithAttachments } from "@/src/types";
import toolLogCount from "@/src/utils/tool-log-count";

type Props = {
    message: Pick<BotMessageWithAttachments, "author" | "text" | "tool_log">;
};

/**
 * "No tools used" under a long bot message whose run called no tool, in
 * the row beside its timestamp: such a message can only say what the bot
 * already knew, so a report of work in it wasn't done. A bot wrote a
 * contest scan with links and a file in one, and the user acted on it.
 */
export default function MessageNoToolsChip({ message }: Props) {
    if (message.author != "bot") return null;
    if ((message.text || "").length < AppData.MessageNoToolsMinChars) return null;
    if (toolLogCount({ tool_log: message.tool_log }) !== 0) return null;

    return (
        <Span
            title="The app's record shows this message's run called no tools: nothing was browsed, saved or changed for it."
            className="text-[11px] leading-4 text-ink-secondary whitespace-nowrap cursor-help"
        >
            No tools used
        </Span>
    );
}
