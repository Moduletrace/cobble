import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import type { TextLoopStep } from "@/src/harness/text/run-text-loop";
import type { HarnessToolUse } from "@/src/harness/types";

export type BotJobContext = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    params: Record<string, unknown>;
    /**
     * Saved by an earlier attempt, if the job was picked up again.
     */
    checkpoint: Record<string, unknown> | null;
    /**
     * Aborted when the job is cancelled or lost to another handler. Stop
     * work and return; the result is discarded.
     */
    signal: AbortSignal;
    /**
     * Save progress and a checkpoint. The lock is renewed on a timer
     * already, so call this for meaningful steps. False once the job is
     * cancelled or lost.
     */
    update: (params: {
        progress?: string;
        checkpoint?: Record<string, unknown>;
    }) => Promise<boolean>;
    /**
     * Records a model turn as a step (`bots_queue_updates`), saves it as
     * the job's progress and pushes it live. Pass it as the text loop's
     * `onStep`. Best effort: a failed write never stops the job.
     */
    report: (step: TextLoopStep) => Promise<void>;
};

export type BotJobOutcome = {
    /**
     * The completion message for the user (markdown).
     */
    result: string;
    needs_you?: boolean;
    /**
     * Finish without posting `result` (a reply with nothing left to answer).
     */
    silent?: boolean;
    /**
     * Files the bot wrote and asked to send with its message (`media`
     * ids), attached to the result message.
     */
    attachments?: number[];
    /**
     * Every tool call the run made (`runTextLoop`'s `tool_uses`), kept on
     * the result message as `tool_log`.
     */
    tool_log?: HarnessToolUse[];
};

export type BotJobRunner = (context: BotJobContext) => Promise<BotJobOutcome>;
