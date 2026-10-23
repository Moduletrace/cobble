type Params = {
    /**
     * What the install saved, as it came out of `app_settings`: undefined or
     * empty when it never did.
     */
    saved?: string | null;
    /**
     * The code's own limit, used whenever the saved one can't be trusted.
     */
    fallback: number;
    /**
     * The most a saved limit may ask for.
     */
    max: number;
};

/**
 * Reads a tool-step limit saved in the settings, falling back to the code's
 * default when it is missing, not a whole number, below one, or above the
 * ceiling. The settings page and the saved row are both untrusted input:
 * without this a typo (or a zero) would stop every run before its first
 * turn, and a huge number would let one run alone run for hours.
 */
export default function readStepLimit({ saved, fallback, max }: Params) {
    const text = String(saved ?? "").trim();

    if (!text) return fallback;

    const value = Number(text);

    if (!Number.isInteger(value) || value < 1 || value > max) return fallback;

    return value;
}
