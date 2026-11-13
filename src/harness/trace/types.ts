import type { HarnessUsage } from "../types";

/**
 * One model turn as the debug view keeps it: what the model answered, what
 * it reasoned, the tools it asked for, and what the turn cost.
 */
export type HarnessTurnTrace = {
    kind: "turn";
    index: number;
    model: string | null;
    provider: string | null;
    text: string | null;
    reasoning: string | null;
    tool_calls: { name: string; arguments: string }[];
    usage: HarnessUsage | null;
    finish_reason: string | null;
    duration_ms: number;
};

/**
 * One tool call as the debug view keeps it: the arguments the model wrote
 * and what the tool answered. Both are the model's own text, so both may
 * hold a secret value: a trace is redacted before it is stored
 * (`redactTrace`).
 */
export type HarnessToolTrace = {
    kind: "tool";
    index: number;
    name: string;
    arguments: string;
    result: string;
    ok: boolean;
    images: number;
    duration_ms: number;
    /**
     * The step whose identical read answered this call, when the loop
     * skipped it (`alreadyRanToolNote`).
     */
    repeat_of?: number | null;
};

/**
 * Something the loop itself did, that no turn or tool call shows: a
 * context trim, the wrap up, what the user wrote mid-run, an answer
 * `review` sent back.
 */
export type HarnessEventTrace = {
    kind: "event";
    index: number;
    name: string;
    text: string | null;
};

export type HarnessTrace = HarnessTurnTrace | HarnessToolTrace | HarnessEventTrace;

/**
 * Where a run's detailed trace goes (`bot_job_traces`, read by the
 * conversation's debug view). Best effort: the loop never fails because a
 * trace couldn't be kept.
 */
export type HarnessTracer = (trace: HarnessTrace) => Promise<void> | void;