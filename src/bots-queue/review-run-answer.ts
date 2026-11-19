import type { HarnessToolUse } from "@/src/harness/types";
import type { StorageScope } from "@/src/utils/storage-access";
import reviewBotReply from "./review-bot-reply";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    session_id: number | string;
    scopes: StorageScope[];
};

/**
 * The check a reply and a task report share, as `runTextLoop`'s `review`:
 * files, tasks, graphics and work the answer names, against the app's
 * record (`reviewBotReply`). One place so a task report is held to the
 * same record as a chat reply.
 */
export default function reviewRunAnswer({ bot_id, user_id, session_id, scopes }: Params) {
    return ({ text, tool_uses }: { text: string; tool_uses: HarnessToolUse[] }) =>
        reviewBotReply({ text, tool_uses, bot_id, user_id, session_id, scopes });
}
