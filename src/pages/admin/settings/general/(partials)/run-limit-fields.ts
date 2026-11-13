import { isUnlimitedLimit, type RunLimit } from "@/src/utils/run-limit";

/**
 * The six limits the run limits form saves, and what each is called.
 */
export type RunLimitFieldKey =
    | "task_steps"
    | "reply_steps"
    | "unattended_steps"
    | "run_tokens"
    | "context_tokens"
    | "model_rest_seconds";

export const RunLimitFieldLabels: Record<RunLimitFieldKey, string> = {
    task_steps: "Tool steps per task",
    reply_steps: "Tool steps per chat reply",
    unattended_steps: "Tool steps per routine or hook call",
    run_tokens: "Tokens per run",
    context_tokens: "Working context",
    model_rest_seconds: "Model rest after a failure",
};

/**
 * One field of the form: what is typed in it, and whether its limit is off
 * entirely. The number is kept while the limit is off, so turning it back
 * on shows what was there.
 */
export type RunLimitFieldValue = { value: string; unlimited: boolean };

/**
 * The fields with their switch off and no number in them. Each would save
 * as 0, and 0 is the code's default, which may itself be no limit: the
 * form asks for a number rather than save something the user didn't mean.
 */
export function emptyRunLimitFields({
    values,
}: {
    values: Record<RunLimitFieldKey, RunLimitFieldValue>;
}): string[] {
    return (Object.keys(values) as RunLimitFieldKey[])
        .filter((key) => !values[key].unlimited && values[key].value.trim() === "")
        .map((key) => RunLimitFieldLabels[key]);
}

/**
 * The number a field shows once its No limit switch is turned off and it
 * holds none yet: the default the setting would use. A default that is
 * itself unlimited has no number to show, so the field starts at the
 * highest it may hold, the one number that is certainly a limit.
 */
export function startRunLimitNumber({
    limit,
    ceiling,
}: {
    limit?: RunLimit;
    ceiling: number;
}): number {
    return limit === undefined || isUnlimitedLimit(limit) ? ceiling : limit;
}