import type { WorkspaceWithActivity } from "@/src/types";

type Params = {
    workspaces: WorkspaceWithActivity[];
    /**
     * The workspace this browser was last in (`readLastVisitedWorkspace`).
     */
    first_id?: number | null;
};

/**
 * The rail's workspaces with the last visited one first, the rest in
 * their order. Unchanged when it isn't among them.
 */
export default function orderRailWorkspaces({ workspaces, first_id }: Params): WorkspaceWithActivity[] {
    if (!first_id) return workspaces;

    const first = workspaces.find((workspace) => Number(workspace.id) === Number(first_id));

    if (!first) return workspaces;

    return [first, ...workspaces.filter((workspace) => workspace !== first)];
}
