type Params = {
    /**
     * A bot message's `task_ids` (JSON list of task ids), or a list of ids
     * to tidy before it's stored.
     */
    task_ids?: string | (number | string | null | undefined)[] | null;
};

/**
 * The tracker task ids a bot message is about: positive integers, each
 * once, in the order they were first touched. Anything unreadable reads as
 * none, so a bad row never breaks the thread.
 */
export default function messageTaskIds({ task_ids }: Params): number[] {
    let list: unknown = task_ids;

    if (typeof task_ids == "string") {
        try {
            list = JSON.parse(task_ids);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(list)) return [];

    const ids = list.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);

    return [...new Set(ids)];
}
