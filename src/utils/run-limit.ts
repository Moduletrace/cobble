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