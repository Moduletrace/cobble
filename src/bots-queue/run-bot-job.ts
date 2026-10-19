import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import HarnessError from "@/src/harness/harness-error";
import BotJobFatalError from "./bot-job-fatal-error";
import runBotReply from "./run-bot-reply";
import runBotTask from "./run-bot-task";
import type { BotJobRunner } from "./types";

/**
 * Does a job's actual work on the harness: a `reply` answers the user in
 * chat (`runBotReply`), a `task` works through its brief (`runBotTask`).
 *
 * Harness failures that waiting can fix (rate limits, outages) are thrown
 * as they are, so the queue retries with backoff; the rest are fatal.
 */
const runBotJob: BotJobRunner = async (context) => {
    const { job } = context;
    const bot = job.bot_id ? await grabBotById({ bot_id: job.bot_id }) : null;

    if (!bot?.id || !bot.user_id) {
        throw new BotJobFatalError(`The bot for this job no longer exists.`);
    }

    const owned = { ...bot, id: bot.id, user_id: bot.user_id };

    try {
        return job.kind == "reply"
            ? await runBotReply({ ...context, bot: owned })
            : await runBotTask({ ...context, bot: owned });
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
