import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import claimsWorkUnderWay from "@/src/utils/claims-work-under-way";
import { AskStages } from "@/src/dict/ask-dict";
import deleteEmptyAskSession from "../bot-sessions/delete-empty-ask-session";
import finishAsk from "./finish-ask";
import grabAsk from "./grab-ask";
import shareAskFiles from "./share-ask-files";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * What the run answered.
     */
    text: string;
    failed?: boolean;
};

/**
 * Ends an ask when the run working it ends: the gate's review (its own
 * decision already applied when it finished) or the asked bot's answer,
 * whose files are copied for the asking bot first. The asking bot is woken
 * with the outcome (`finishAsk`).
 */
export default async function onAskJobEnded({ job, text, failed }: Params) {
    const params = parseJobJson({ text: job.params }) || {};
    const ask_id = Number(params.ask_id) || 0;

    if (!ask_id) return;

    const ask = await grabAsk({ ask_id });

    if (!ask?.id || (ask.status != "pending" && ask.status != "working")) return;

    if (params.stage == AskStages.review) {
        /**
         * The review never writes into its hidden session, so it goes.
         */
        await deleteEmptyAskSession({ session_id: job.session_id! });

        /**
         * A finished review applied its decision itself; only a failed one
         * leaves the ask waiting.
         */
        if (!failed) return;

        await finishAsk({
            ask,
            status: "failed",
            outcome: "The coordinator couldn't review this request. Try again in a moment.",
        });

        return;
    }

    /**
     * Only the run answering it ends it: a job that lost its claim left an
     * older one behind, whose late failure says nothing about this one.
     */
    if (ask.job_id && Number(ask.job_id) != Number(job.id)) return;

    if (failed) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: "The bot it was passed to couldn't answer. Try again, or ask another bot.",
        });

        return;
    }

    const answer = (text || "").trim();

    if (!answer) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: "The bot it was passed to ended without an answer.",
        });

        return;
    }

    /**
     * A reply that only says the work is under way isn't an answer: the
     * asking bot would carry the promise back as the result. The request
     * fails instead, so it knows to try again.
     */
    if (claimsWorkUnderWay({ text: answer })) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: "It ended without answering: it only said the work was under way.",
        });

        return;
    }

    const shared = await shareAskFiles({ ask, answer });

    await finishAsk({ ask, status: "answered", outcome: shared });
}
