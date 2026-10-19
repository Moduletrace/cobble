import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import grabJobUserId from "@/src/functions/backend/db/bots-queue/grab-job-user-id";
import HarnessError from "@/src/harness/harness-error";
import BotJobFatalError from "./bot-job-fatal-error";
import runBotReply from "./run-bot-reply";
import runBotTask from "./run-bot-task";
import type { BotJobRunner } from "./types";

/**
 * Does a job's actual work on the harness: a `reply` answers the user in
 * chat (`runBotReply`), a `task` works through its brief (`runBotTask`).
 *
 * It works for the user whose conversation the job is in: their memory,
 * and only what they can reach.
 *
 * Harness failures that waiting can fix (rate limits, outages) are thrown
 * as they are, so the queue retries with backoff; the rest are fatal.
 */
const runBotJob: BotJobRunner = async (context) => {
    const { job } = context;
    const bot = job.bot_id ? await grabBotById({ bot_id: job.bot_id }) : null;

    if (!bot?.id) {
        throw new BotJobFatalError(`The bot for this job no longer exists.`);
    }

    const user_id = await grabJobUserId({ job });

    if (!user_id) {
        throw new BotJobFatalError(`The conversation for this job no longer exists.`);
    }

    const owned = { ...bot, id: bot.id };

    try {
        return job.kind == "reply"
            ? await runBotReply({ ...context, bot: owned, user_id })
            : await runBotTask({ ...context, bot: owned, user_id });
    } catch (error: unknown) {
        if (
            error instanceof HarnessError &&
            error.code != "aborted" &&
            !error.retryable
        ) {
            throw new BotJobFatalError(error.message);
        }

        throw error;
    }
};

export default runBotJob;
