import conversationMarkdown from "@/src/utils/conversation-markdown";
import copyPendingText from "@/src/utils/copy-pending-text";
import fetchConversationExport from "./fetch-conversation-export";

/**
 * Puts the conversation's active session on the clipboard as one markdown
 * document. The clipboard write starts at once with a pending
 * `ClipboardItem`, so it keeps the user's gesture (the menu's click, or the
 * Enter keypress that ran `/copy`) even though the export is still
 * fetching. Returns nothing on success, or the reason to show.
 */
export default async function copyConversation({
    bot_id,
    workspace_id,
}: {
    bot_id: number;
    workspace_id?: number | null;
}): Promise<string | null> {
    const markdown = fetchConversationExport({ bot_id, workspace_id }).then((res) => {
        if (!res?.success || !res.singleRes) {
            throw new Error(res?.msg || "Couldn't load the chat.");
        }

        return conversationMarkdown({ conversation: res.singleRes, now: Date.now() });
    });

    try {
        const worked = await copyPendingText({ text: markdown });

        return worked ? null : "Couldn't copy the chat to the clipboard.";
    } catch (error: unknown) {
        return error instanceof Error ? error.message : "Couldn't copy the chat.";
    }
}
