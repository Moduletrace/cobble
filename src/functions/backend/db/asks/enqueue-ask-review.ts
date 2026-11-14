import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import { AskReviewJobTitle, AskStages } from "@/src/dict/ask-dict";
import ensureCoordinatorBot from "../bots/ensure-coordinator-bot";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import ensureAskSession from "./ensure-ask-session";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
};

/**
 * Queues the one turn that gates a request: the coordinator reads it with
 * no tools and answers approve / redirect / refuse (`runAskReview`). Its
 * work is recorded in the coordinator's hidden session for the ask.
 */
export default async function enqueueAskReview({ ask }: Params) {
    const coordinator_id = Number(await ensureCoordinatorBot({ user_id: Number(ask.user_id) }));
    const session = await ensureAskSession({ ask, bot_id: coordinator_id });

    const job_id = await enqueueBotJob({
        kind: "reply",
        user_id: Number(ask.user_id),
        bot_id: coordinator_id,
        session_id: session.id!,
        title: AskReviewJobTitle,
        instructions: ask.request || "",
        params: { ask_id: ask.id, stage: AskStages.review },
    });

    return Number(job_id);
}
