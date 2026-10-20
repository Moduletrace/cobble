/**
 * How a message names a workspace: `[workspace:2]`. The chat shows it as a
 * link to that workspace.
 */
export default function workspaceRef({ id }: { id: number | string }) {
    return `[workspace:${id}]`;
}
