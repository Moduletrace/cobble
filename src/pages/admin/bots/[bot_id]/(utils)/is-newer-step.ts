type Step = {
    id: number | string;
};

type Params = {
    /**
     * The step the thinking row shows.
     */
    shown: Step | null;
    /**
     * The step that arrived: pushed live, replayed by the catch-up, or
     * read with the history.
     */
    step: Step | null;
};

/**
 * Whether a step replaces the one on screen. Steps arrive by push and are
 * also read from the server (a reload's history, the catch-up's replay), so
 * one read just before a newer push reached the page must not take the
 * thinking row's line back: rows only ever move forward.
 */
export default function isNewerStep({ shown, step }: Params) {
    if (!step) return false;

    return !shown || Number(step.id) > Number(shown.id);
}