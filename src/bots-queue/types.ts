import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";

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
};

export type BotJobRunner = (context: BotJobContext) => Promise<BotJobOutcome>;
