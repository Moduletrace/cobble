import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import type { HarnessToolUse } from "@/src/harness/types";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import claimsWorkUnderWay from "@/src/utils/claims-work-under-way";
import { WorkStartingTools } from "@/src/utils/reply-claim-problems";
import stripQuestionRefs from "@/src/utils/strip-question-refs";
import { AskStages } from "@/src/dict/ask-dict";
import hasOpenWork from "../bots-queue/has-open-work";
import deleteEmptyAskSession from "../bot-sessions/delete-empty-ask-session";
import askUpdateMessage from "./ask-update-message";
import finishAsk from "./finish-ask";
import grabAsk from "./grab-ask";
import shareAskFiles from "./share-ask-files";
import tellAskRequester from "./tell-ask-requester";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * What the run answered.
     */
    text: string;
    failed?: boolean;
    /**
     * The run's tool calls, so an answer that really started work isn't
     * faulted for saying so (the same exemption the reply review uses).
     */
    tool_uses?: HarnessToolUse[];
};

/**
 * Ends a crew request as the runs working it end. The gate's review applies
 * its own decision. The asked bot's first answer is only the whole answer
 * when it started no work that is still open: an answer that acknowledges
 * the brief and kicks off a run (`start_task`) keeps the request open, and
 * each result comes back to the asking bot as it lands - the last one ends
 * the request (`finishAsk`). A reply that only promises work without
 * starting any still fails, so the asking bot knows to try again.
 */
export default async function onAskJobEnded({ job, text, failed, tool_uses = [] }: Params) {
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
     * The session the request is being answered in: the target bot's
     * conversation the brief landed in. Every run carrying this ask_id
     * works from it, so "is anything still open" is read there.
     */
    const answer_session_id = Number(ask.session_id) || Number(job.session_id);

    if (params.stage == AskStages.answer) {
        /**
         * Only the run answering it ends it: a job that lost its claim left
         * an older one behind, whose late failure says nothing about this one.
         */
        if (ask.job_id && Number(ask.job_id) != Number(job.id)) return;

        /**
         * The answer started work that is still running (a task, a hand-over,
         * a nested request): the acknowledgement is not the answer. The
         * request stays open and the results come back as they land; the
         * ack itself is not relayed, so the asking bot isn't woken for a
         * promise.
         */
        if (await hasOpenWork({ bot_id: job.bot_id!, session_id: answer_session_id })) return;

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
         * A reply that only says the work is under way, without having
         * started any, isn't an answer: the asking bot would carry the
         * promise back as the result. One that really called a work-starting
         * tool (or was refused trying) is reporting what the app did, so it
         * isn't faulted - the same exemption the reply review uses.
         */
        const started = tool_uses.some((use) => use.ok && WorkStartingTools.includes(use.name));
        const tried = tool_uses.some((use) => WorkStartingTools.includes(use.name));

        if (!started && !tried && claimsWorkUnderWay({ text: answer })) {
            await finishAsk({
                ask,
                status: "failed",
                outcome: "It ended without answering: it only said the work was under way.",
            });

            return;
        }

        const shared = await shareAskFiles({ ask, answer });

        await finishAsk({ ask, status: "answered", outcome: shared });

        return;
    }

    /**
     * A run the answer handed the work to (`start_task`, `delegate_task`),
     * carrying the ask_id. Its result goes back to the bot that asked. While
     * more of the request's work is still open it's relayed as an update and
     * the request stays open; the last result ends it.
     */
    const result = (text || "").trim();
    const still_open = await hasOpenWork({ bot_id: ask.target_bot_id!, session_id: answer_session_id });

    if (still_open) {
        if (result) {
            const shared = await shareAskFiles({ ask, answer: result });

            await tellAskRequester({
                ask,
                text: askUpdateMessage({
                    ask,
                    text: stripQuestionRefs({ text: shared }).text,
                    failed,
                }),
            });
        }

        return;
    }

    if (failed) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: result || "The bot it was passed to couldn't answer. Try again, or ask another bot.",
        });

        return;
    }

    if (!result) {
        await finishAsk({
            ask,
            status: "failed",
            outcome: "The bot it was passed to ended without an answer.",
        });

        return;
    }

    const shared = await shareAskFiles({ ask, answer: result });

    await finishAsk({ ask, status: "answered", outcome: shared });
}
