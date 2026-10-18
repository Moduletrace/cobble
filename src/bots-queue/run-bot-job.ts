import type { BotJobRunner } from "./types";
import BotJobFatalError from "./bot-job-fatal-error";

/**
 * Does a job's actual work: the bot follows `job.instructions` with its
 * full prompt (`grabBotPrompt`), on `job.computer_id` if set, and returns
 * the message for the user. This is where the model layer plugs in; until
 * it exists every job fails at once and the user is told.
 */
const runBotJob: BotJobRunner = async () => {
    throw new BotJobFatalError(`Bots can't run queued work yet.`);
};

export default runBotJob;
