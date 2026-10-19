import bunext from "@moduletrace/bunext";
import { AppData } from "@/src/data/app-data";
import type { BotJobKind } from "@/src/dict/bot-queue-dict";
import claimBotJobs from "@/src/functions/backend/db/bots-queue/claim-bot-jobs";
import releaseWorkerBotJobs from "@/src/functions/backend/db/bots-queue/release-worker-bot-jobs";
import { logError } from "@/src/functions/backend/logger";
import processBotJob from "./process-bot-job";
import reportLostBotJobs from "./report-lost-bot-jobs";
import { setBotsQueueWaker } from "./wake-bots-queue";

const worker = AppData.BotQueueWorker;
const running = { task: 0, reply: 0 };
let polling = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Starts the `bots_queue` handler: releases jobs a restart cut off, then
 * polls every `AppData.BotQueuePollMs`, reporting lost jobs and claiming
 * up to `AppData.BotQueueConcurrency` tasks and, on their own slots,
 * `AppData.BotQueueReplyConcurrency` chat replies. Gated in production to the
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

    setBotsQueueWaker({ waker: wake });
    poll();
}

/**
 * Polls now, unless a poll is already running (`wakeBotsQueue`).
 */
function wake() {
    if (polling) return;

    clearTimeout(timer);
    poll();
}

async function claimAndRun({ kind, slots }: { kind: BotJobKind; slots: number }) {
    const free = slots - running[kind];

    if (free < 1) return;

    for (const job of await claimBotJobs({ worker, limit: free, kind })) {
        running[kind]++;

        processBotJob({ job, worker })
            .catch((error) =>
                logError({
                    title: `Bot job #${job.id} crashed`,
                    error,
                }).catch(() => {}),
            )
            .finally(() => {
                running[kind]--;
            });
    }
}

async function poll() {
    polling = true;

    try {
        await reportLostBotJobs();

        await claimAndRun({ kind: "reply", slots: AppData.BotQueueReplyConcurrency });
        await claimAndRun({ kind: "task", slots: AppData.BotQueueConcurrency });
    } catch (error) {
        await logError({ title: "Bots queue poll failed", error }).catch(
            () => {},
        );
    } finally {
        polling = false;
        clearTimeout(timer);
        timer = setTimeout(poll, AppData.BotQueuePollMs);
    }
}
