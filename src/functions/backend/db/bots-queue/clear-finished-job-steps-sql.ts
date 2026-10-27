type Params = {
    /**
     * Jobs that ended before this (unix ms) have their steps cleared.
     */
    before: number;
};

/**
 * The two statements that clear the steps (`bots_queue_updates`) of jobs
 * that ended before `before`: first each job keeps how many it recorded
 * (`bots_queue.steps`, for the message details), then the steps go. A job
 * that's still open, or one retrying after a failed attempt, keeps its
 * steps. Run in this order: the count reads the rows the delete removes.
 */
export default function clearFinishedJobStepsSql({ before }: Params) {
    const finished = `SELECT id FROM bots_queue WHERE status IN ('completed', 'failed') AND COALESCE(finished_at, updated_at) < ?`;

    return {
        count: {
            sql: `UPDATE bots_queue SET steps = COALESCE(steps, 0) + (SELECT COUNT(*) FROM bots_queue_updates u WHERE u.bots_queue_id = bots_queue.id)
                WHERE id IN (${finished}) AND EXISTS (SELECT 1 FROM bots_queue_updates u WHERE u.bots_queue_id = bots_queue.id)`,
            values: [before],
        },
        clear: {
            sql: `DELETE FROM bots_queue_updates WHERE bots_queue_id IN (${finished})`,
            values: [before],
        },
    };
}
