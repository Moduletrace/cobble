import bunext from "@moduletrace/bunext";
import { AppData } from "@/src/data/app-data";
import claimBotJobs from "@/src/functions/backend/db/bots-queue/claim-bot-jobs";
import releaseWorkerBotJobs from "@/src/functions/backend/db/bots-queue/release-worker-bot-jobs";
import { logError } from "@/src/functions/backend/logger";
import processBotJob from "./process-bot-job";
import reportLostBotJobs from "./report-lost-bot-jobs";

const worker = AppData.BotQueueWorker;
let running = 0;

/**
 * Starts the `bots_queue` handler: releases jobs a restart cut off, then
 * polls every `AppData.BotQueuePollMs`, reporting lost jobs and claiming
 * up to `AppData.BotQueueConcurrency` at once. Gated in production to the
 * `MAIN_SERVER` container, like cron.
 */
export default async function botsQueue() {
    if (process.env.NODE_ENV == "production" && !process.env.MAIN_SERVER) {
        return;
    }

    bunext.bunextLog.watch(`Running Bots Queue ...`);

    const released = await releaseWorkerBotJobs({ worker });

    if (released) {
        bunext.bunextLog.info(`Bots queue: released ${released} cut-off job(s)`);
    }

    poll();
}

async function poll() {
    try {
        await reportLostBotJobs();

        const free = AppData.BotQueueConcurrency - running;

        if (free > 0) {
            const jobs = await claimBotJobs({ worker, limit: free });

            for (const job of jobs) {
                running++;

                processBotJob({ job, worker })
                    .catch((error) =>
                        logError({
                            title: `Bot job #${job.id} crashed`,
                            error,
                        }).catch(() => {}),
                    )
                    .finally(() => {
                        running--;
                    });
            }
        }
    } catch (error) {
        await logError({ title: "Bots queue poll failed", error }).catch(
            () => {},
        );
    } finally {
        setTimeout(poll, AppData.BotQueuePollMs);
    }
}
