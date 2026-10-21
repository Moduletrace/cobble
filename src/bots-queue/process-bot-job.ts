import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import setBotFace from "@/src/functions/backend/db/bots/set-bot-face";
import completeBotJob from "@/src/functions/backend/db/bots-queue/complete-bot-job";
import failBotJob from "@/src/functions/backend/db/bots-queue/fail-bot-job";
import updateBotJob from "@/src/functions/backend/db/bots-queue/update-bot-job";
import insertBotJobUpdate from "@/src/functions/backend/db/bots-queue/insert-bot-job-update";
import { logError } from "@/src/functions/backend/logger";
import createKeyLock from "@/src/utils/create-key-lock";
import withTimeout from "@/src/utils/with-timeout";
import HarnessError from "@/src/harness/harness-error";
import deferBotJob from "@/src/functions/backend/db/bots-queue/defer-bot-job";
import recordCronJobFailure from "@/src/functions/backend/db/cron-jobs/record-cron-job-failure";
import scheduledRunRetryAt from "@/src/utils/scheduled-run-retry-at";
import {
    BotComputerBusyStatusLine,
    BotReplyJobTitle,
    BotTaskStatusLine,
    BotWaitingStatusLine,
} from "@/src/dict/bot-queue-dict";
import BotJobFatalError from "./bot-job-fatal-error";
import describeJobStep from "./describe-job-step";
import pushToSessionUser from "./push-to-session-user";
import pushBotNotice from "./push-bot-notice";
import grabJobUserId from "@/src/functions/backend/db/bots-queue/grab-job-user-id";
import runBotJob from "./run-bot-job";
import parseJobJson from "./parse-job-json";
import nameBotSession from "./name-bot-session";
import pushBotSession from "./push-bot-session";
import type { BotJobUpdateData } from "@/src/types";
import type { BotJobContext, BotJobRunner } from "./types";

/**
 * One job per computer at a time, across all running jobs.
 */
const computer_lock = createKeyLock();

/**
 * One reply per conversation at a time, so replies never cross in the
 * chat. A bot's other sessions answer side by side.
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
 * dropped. A failed scheduled run (a routine) is retried with longer gaps
 * (`scheduledRunRetryAt`); once out of tries the user is told, and the
 * schedule keeps why (`recordCronJobFailure`).
 */
export default async function processBotJob({
    job,
    worker,
    runner = runBotJob,
}: Params) {
    if (!job.id || !job.bot_id) return;

    const job_id = job.id;
    const bot_id = job.bot_id;
    const params = parseJobJson({ text: job.params }) || {};
    const schedule_id = Number(params.schedule_id) || null;

    /**
     * Its face changes only for the user it works for.
     */
    const user_id = await grabJobUserId({ job }).catch(() => null);

    const setFace = async (face: Omit<Parameters<typeof setBotFace>[0], "bot_id" | "user_id">) => {
        if (!user_id) return;

        await pushBotNotice({ bot_id, bot: await setBotFace({ bot_id, user_id, ...face }) });
    };
    const controller = new AbortController();
    /**
     * The deadline is the one abort that is a failure, not a cancellation:
     * the job's error is then the timeout's, not the "Cancelled." an
     * aborted model request reports.
     */
    const timeout_message = `"${job.title || "The job"}" took too long and was stopped.`;
    let timed_out = false;

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

            /**
             * A deadline per attempt: the heartbeat keeps the lock alive
             * for as long as this run takes, so without one a call that
             * never answers would hold the slot forever.
             */
            return await withTimeout({
                timeout_ms: AppData.BotJobAttemptTimeoutMs,
                signal: controller.signal,
                message: timeout_message,
                on_timeout: () => {
                    timed_out = true;
                },
                task: (run_signal) =>
                    runner({
                        job,
                        params,
                        checkpoint: parseJobJson({ text: job.checkpoint }),
                        signal: run_signal,
                        update,
                        report,
                    }),
            });
        };

        /**
         * A task whose computer is busy says so while it waits, so the
         * user doesn't see silence.
         */
        const runOnComputer = async (computer_id: number) => {
            if (computer_lock.busy({ key: computer_id })) {
                await setFace({ face: "asleep", status_line: BotComputerBusyStatusLine });
            }

            return await computer_lock.run({ key: computer_id, task: run });
        };

        const outcome =
            job.kind == "reply"
                ? await reply_lock.run({ key: job.session_id || `bot-${bot_id}`, task: run })
                : job.computer_id
                  ? await runOnComputer(job.computer_id)
                  : await run();

        if (controller.signal.aborted) return;

        const completion = await completeBotJob({
            job_id,
            worker,
            result: outcome.result,
            needs_you: outcome.needs_you,
            silent: outcome.silent,
            attachments: outcome.attachments,
        });

        await pushBotNotice({ bot_id, ...completion });

        /**
         * Once the first exchange is sent, the bot names the session and
         * previews it. After the reply is pushed, so it never waits on it;
         * a model that can't answer now leaves the session for the next
         * reply to name.
         */
        if (job.kind == "reply" && completion.message && job.session_id) {
            const session_id = Number(job.session_id);

            /**
             * No job signal: the job is already complete, so its heartbeat
             * no longer holds a lock and would abort this naming turn.
             */
            const named = await nameBotSession({
                session_id,
                bot_id,
                workspace_id: job.workspace_id,
            }).catch(async (error: unknown) => {
                await logError({ title: `Bot session #${session_id} not named`, error }).catch(
                    () => {},
                );
                return false;
            });

            if (named) {
                await pushBotSession({
                    session_id,
                    bot_id,
                    workspace_id: job.workspace_id,
                });
            }
        }
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

        const message = timed_out
            ? timeout_message
            : error instanceof Error
              ? error.message
              : String(error);
        const tries = Number(job.attempts) || 1;

        const failed = await failBotJob({
            job_id,
            worker,
            error: message,
            fatal: error instanceof BotJobFatalError,
            failure_message: schedule_id
                ? `My scheduled run "${job.title || "Scheduled task"}" failed after ${tries} ${tries == 1 ? "try" : "tries"}: ${message}`
                : undefined,
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

        if (schedule_id && failed?.status == "failed") {
            await recordCronJobFailure({ cron_job_id: schedule_id, job_id, error: message }).catch(
                () => {},
            );
        }

        /**
         * A routine's retry waits long enough for an outage to pass.
         */
        if (schedule_id && failed?.status == "pending") {
            await deferBotJob({ job_id, worker, until: scheduledRunRetryAt({ attempts: failed.attempts }) });
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
