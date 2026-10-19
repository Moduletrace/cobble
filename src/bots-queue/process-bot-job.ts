import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import setBotFace from "@/src/functions/backend/db/bots/set-bot-face";
import completeBotJob from "@/src/functions/backend/db/bots-queue/complete-bot-job";
import failBotJob from "@/src/functions/backend/db/bots-queue/fail-bot-job";
import updateBotJob from "@/src/functions/backend/db/bots-queue/update-bot-job";
import insertBotJobUpdate from "@/src/functions/backend/db/bots-queue/insert-bot-job-update";
import { logError } from "@/src/functions/backend/logger";
import createKeyLock from "@/src/utils/create-key-lock";
import HarnessError from "@/src/harness/harness-error";
import deferBotJob from "@/src/functions/backend/db/bots-queue/defer-bot-job";
import { BotReplyJobTitle, BotTaskStatusLine, BotWaitingStatusLine } from "@/src/dict/bot-queue-dict";
import BotJobFatalError from "./bot-job-fatal-error";
import describeJobStep from "./describe-job-step";
import pushToSessionUser from "./push-to-session-user";
import pushBotNotice from "./push-bot-notice";
import grabJobUserId from "@/src/functions/backend/db/bots-queue/grab-job-user-id";
import runBotJob from "./run-bot-job";
import parseJobJson from "./parse-job-json";
import type { BotJobUpdateData } from "@/src/types";
import type { BotJobContext, BotJobRunner } from "./types";

/**
 * One job per computer at a time, across all running jobs.
 */
const computer_lock = createKeyLock();

/**
 * One reply per bot at a time, so replies never cross in the chat.
 */
const reply_lock = createKeyLock();

/**
 * Renew the lock well inside the timeout, so one slow write can't lose it.
 */
const HEARTBEAT_MS = Math.floor(AppData.BotQueueLockTimeoutMs / 4);

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    worker: string;
    /**
     * Defaults to `runBotJob`.
     */
    runner?: BotJobRunner;
};

/**
 * Runs one claimed job to the end: keeps its lock alive, waits for its
 * computer, runs it, then completes or fails it and pushes the outcome to
 * the user. If the job is cancelled or lost mid-way, its result is
 * dropped.
 */
export default async function processBotJob({
    job,
    worker,
    runner = runBotJob,
}: Params) {
    if (!job.id || !job.bot_id) return;

    const job_id = job.id;
    const bot_id = job.bot_id;

    /**
     * Its face changes only for the user it works for.
     */
    const user_id = await grabJobUserId({ job }).catch(() => null);

    const setFace = async (face: Omit<Parameters<typeof setBotFace>[0], "bot_id" | "user_id">) => {
        if (!user_id) return;

        await pushBotNotice({ bot_id, bot: await setBotFace({ bot_id, user_id, ...face }) });
    };
    const controller = new AbortController();

    const update: BotJobContext["update"] = async (params) => {
        if (controller.signal.aborted) return false;

        const held = await updateBotJob({ job_id, worker, ...params });

        if (!held) controller.abort();

        return held;
    };

    const report: BotJobContext["report"] = async (step) => {
        const described = describeJobStep(step);

        if (!described || controller.signal.aborted) return;

        try {
            if (!(await update({ progress: described.text }))) return;

            const row = await insertBotJobUpdate({ job_id, bot_id, ...described });

            await pushToSessionUser({
                session_id: job.session_id,
                data: {
                    event: "server:bot-job-update",
                    data: {
                        ...row,
                        task_id: job.task_id || null,
                        session_id: job.session_id || null,
                    } satisfies BotJobUpdateData,
                },
            });
        } catch (error) {
            await logError({ title: `Bot job #${job_id} step not saved`, error }).catch(() => {});
        }
    };

    const heartbeat = setInterval(() => {
        update({}).catch(() => {});
    }, HEARTBEAT_MS);

    try {
        /**
         * The face changes once the job really starts, after any wait for
         * its computer.
         */
        const run = async () => {
            await setFace({
                face: "working",
                status_line: job.kind == "reply" ? BotReplyJobTitle : BotTaskStatusLine,
            });

            return await runner({
                job,
                params: parseJobJson({ text: job.params }) || {},
                checkpoint: parseJobJson({ text: job.checkpoint }),
                signal: controller.signal,
                update,
                report,
            });
        };

        const outcome =
            job.kind == "reply"
                ? await reply_lock.run({ key: bot_id, task: run })
                : job.computer_id
                  ? await computer_lock.run({ key: job.computer_id, task: run })
                  : await run();

        if (controller.signal.aborted) return;

        await pushBotNotice({
            bot_id,
            ...(await completeBotJob({
                job_id,
                worker,
                result: outcome.result,
                needs_you: outcome.needs_you,
                silent: outcome.silent,
            })),
        });
    } catch (error: unknown) {
        if (controller.signal.aborted) return;

        /**
         * Every model is cooling down (rate limits): nothing was tried, so
         * wait for the first to come back without using an attempt.
         */
        if (error instanceof HarnessError && error.resting) {
            await deferBotJob({
                job_id,
                worker,
                until: error.retry_at || Date.now() + AppData.HarnessCooldownMs,
                refund: true,
            });

            await setFace({ face: "asleep", status_line: BotWaitingStatusLine });
            return;
        }

        const failed = await failBotJob({
            job_id,
            worker,
            error: error instanceof Error ? error.message : String(error),
            fatal: error instanceof BotJobFatalError,
        }).catch(async (fail_error) => {
            await logError({
                title: `Bot job #${job_id} couldn't be failed`,
                error: fail_error,
            }).catch(() => {});
            return null;
        });

        if (failed?.notice) {
            await pushBotNotice({ bot_id, ...failed.notice });
        }

        /**
         * A retry no sooner than the provider said to come back.
         */
        if (
            failed?.status == "pending" &&
            error instanceof HarnessError &&
            error.retryable &&
            error.retry_at
        ) {
            await deferBotJob({ job_id, worker, until: error.retry_at });
        }
    } finally {
        clearInterval(heartbeat);
    }
}
