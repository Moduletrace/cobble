import type { HarnessToolUse } from "@/src/harness/types";
import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import type { StorageScope } from "@/src/utils/storage-access";
import reviewBotReply from "./review-bot-reply";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    session_id: number | string;
    job_id?: number | string;
    /**
     * The run is a reply with Plan mode on (`PlanModeToolNames`), so a file
     * can't be saved until the user leaves the mode (Tab) or approves a
     * plan. Answering a card does not leave it.
     */
    plan_mode?: boolean;
    scopes: StorageScope[];
};

/**
 * The check a reply and a task report share, as `runTextLoop`'s `review`:
 * files, tasks, graphics and work the answer names, against the app's
 * record (`reviewBotReply`). One place so a task report is held to the
 * same record as a chat reply.
 */
export default function reviewRunAnswer({ bot_id, user_id, session_id, job_id, plan_mode, scopes }: Params) {
    return ({ text, tool_uses, status }: { text: string; tool_uses: HarnessToolUse[]; status?: ReplyStatus }) =>
        reviewBotReply({ text, tool_uses, bot_id, user_id, session_id, job_id, plan_mode, status, scopes });
}
