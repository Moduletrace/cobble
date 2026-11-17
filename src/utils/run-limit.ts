/**
 * The saved or recorded value that means "no limit": a run takes as many
 * steps as its job's deadline allows, spends any number of prompt tokens,
 * keeps its whole window, or a failed model rests until the setting
 * changes.
 *
 * A limit is a number, this, or (in an old call record) `null` for a run
 * that never said, which is not the same as no limit at all.
 */
export const UnlimitedLimit = "unlimited";

export type RunLimit = number | typeof UnlimitedLimit;

/**
 * The `rests_until` timestamp written to a failed-call row when the model
 * rests with no end (`harness_model_rest_seconds` unlimited). The column
 * is a number, so the unlimited rest is recorded as this sentinel rather
 * than left blank: the Details modal reads it back and says the model is
 * benched until the run limits change or the app restarts, the same
 * account the Activity log gives. No real bench is this far out, and it
 * fits SQLite's 64-bit integer (L3).
 */
export const ForeverRestUntil = Number.MAX_SAFE_INTEGER;

/**
 * Whether a saved or recorded limit is the unlimited one.
 */
export function isUnlimitedLimit(value: unknown): value is typeof UnlimitedLimit {
    return value === UnlimitedLimit;
}

/**
 * The smaller of two limits: unlimited gives way to the other one, and
 * both unlimited stay unlimited.
 */
export function smallerRunLimit({ a, b }: { a: RunLimit; b: RunLimit }): RunLimit {
    if (isUnlimitedLimit(a)) return b;
    if (isUnlimitedLimit(b)) return a;

    return Math.min(a, b);
}