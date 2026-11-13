import { isUnlimitedLimit, type RunLimit, UnlimitedLimit } from "./run-limit";

type Params = {
    /**
     * What the install saved, as it came out of `app_settings`: undefined or
     * empty when it never did.
     */
    saved?: string | null;
    /**
     * The code's own limit, used whenever the saved one can't be trusted.
     */
    fallback: RunLimit;
    /**
     * The most a saved limit may ask for.
     */
    max: number;
    /**
     * The least it may ask for (1 unless given).
     */
    min?: number;
};

/**
 * Reads a run limit saved in the settings: no limit, or a whole number of
 * steps, tokens or seconds, falling back to the code's default when it is
 * missing, not a whole number, below one, or above the ceiling (or under
 * the floor). The settings page and the saved row are both untrusted input:
 * without this a typo (or a zero) would stop every run before its first
 * turn, and a huge number would let one run alone run for hours.
 */
export default function readRunLimit({ saved, fallback, max, min = 1 }: Params): RunLimit {
    const text = String(saved ?? "").trim();

    if (!text) return fallback;
    if (isUnlimitedLimit(text.toLowerCase())) return UnlimitedLimit;

    const value = Number(text);

    if (!Number.isInteger(value) || value < Math.max(1, min) || value > max) return fallback;

    return value;
}