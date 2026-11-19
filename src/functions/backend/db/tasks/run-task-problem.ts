type Params = {
    task_id: number | string;
    /**
     * Whether a task with that id is there at all, even one the run can't
     * reach.
     */
    exists: boolean;
};

/**
 * What a run is told when a task id it gave names no task it can work on.
 * A deleted task and one the run can't reach are different answers: told
 * only "isn't one you can work on", a bot filled the gap with a story about
 * permissions and a task that was supposed to be gone, and described it to
 * the user as still open.
 */
export default function runTaskProblem({ task_id, exists }: Params): string {
    if (exists) return `Task #${task_id} isn't one you can work on.`;

    return `Task #${task_id} doesn't exist any more. It was deleted, so don't update or link it again. Create a new task if the work still needs doing.`;
}
