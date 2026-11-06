/**
 * How a message names a task on the tracker: `[task:<id>]`. The chat turns
 * it into a link (`linkComputerRefs`) that renders as a chip opening the
 * task.
 */
export default function taskRef({ id }: { id: number | string }) {
    return `[task:${id}]`;
}

/**
 * The link target a task ref becomes, e.g. `#task-20`.
 */
export const TaskRefHrefPrefix = "#task-";

/**
 * The id in a task ref's link target, or null.
 */
export function taskRefId({ href }: { href?: string | null }) {
    if (!href?.startsWith(TaskRefHrefPrefix)) return null;

    const id = Number(href.slice(TaskRefHrefPrefix.length));

    return Number.isInteger(id) && id > 0 ? id : null;
}
