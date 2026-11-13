type Params = {
    /**
     * The bot's name, as the task's own readers see it.
     */
    name: string;
    /**
     * The task's status now.
     */
    status?: string | null;
    /**
     * Why the run failed, when it did.
     */
    failure?: string | undefined;
    /**
     * The run used every step it was allowed. A handed-over task's run that
     * spends its whole budget and still leaves the task open did not do the
     * work: it ended `completed` with a report saying so, which the tracker
     * never heard of, so the task read as under way forever (a retrofit run
     * spent 242 steps re-reading the branch it had to change, converted
     * nothing, and its task stayed `doing`).
     */
    exhausted?: boolean;
};

export type TrackerTaskEnding = {
    /**
     * Why the task is blocked, or null to leave its status alone.
     */
    blocked_reason: string | null;
    /**
     * The note left on the task, which says the same thing.
     */
    note: string;
};

/**
 * What finishing (or failing) a job says on the task it was handed over
 * with, while that task is still open. The bot moves the task along itself
 * as it works; this only keeps the task honest when it didn't, and a run
 * that says it did nothing blocks the task rather than leaving it looking
 * like work in hand.
 */
export default function trackerTaskEnding({ name, status, failure, exhausted }: Params): TrackerTaskEnding {
    if (failure !== undefined) {
        const note = `${name} couldn't finish it. ${failure}`.trim();

        return { blocked_reason: note, note };
    }

    if (exhausted) {
        const note = `${name} used every step its run allowed and stopped before finishing it. Its report says where it got to, so the rest needs a run of its own.`;

        return { blocked_reason: note, note };
    }

    return { blocked_reason: null, note: `${name}'s run finished; the task is still ${status || "open"}.` };
}