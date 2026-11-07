import grabMessageRefNames from "@/src/functions/backend/db/bots/grab-message-ref-names";
import type { HarnessMessage } from "@/src/harness/types";
import type { BotMessageWithAttachments } from "@/src/types";
import botMessagesToHarness from "./bot-messages-to-harness";
import loadAttachmentParts from "./load-attachment-parts";

type Params = {
    messages: BotMessageWithAttachments[];
    /**
     * Whose conversation it is: the refs in the user's messages are named
     * as that user sees them.
     */
    user_id: number | string;
};

/**
 * A conversation's messages as a run reads them: with the files of each
 * (`loadAttachmentParts`) and the names of the bots, workspaces and other
 * refs the user's messages point at. Replies and task runs read the same
 * way.
 */
export default async function messagesToTurns({ messages, user_id }: Params): Promise<HarnessMessage[]> {
    return botMessagesToHarness({
        messages,
        parts: await loadAttachmentParts({ messages }),
        refs: await grabMessageRefNames({
            texts: messages.filter((m) => m.author == "user").map((m) => m.text || ""),
            user_id,
        }),
    });
}
