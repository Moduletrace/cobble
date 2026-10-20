import type { WorkspaceWithActivity } from "@/src/types";

/**
 * Workspaces as page props carry them for the rail: without their shared
 * context (`system_prompt`), which only the open workspace's own pages
 * read, from their `workspace` prop.
 */
export default function railWorkspaces({
    workspaces,
}: {
    workspaces: WorkspaceWithActivity[];
}): WorkspaceWithActivity[] {
    return workspaces.map(({ system_prompt, ...workspace }) => workspace);
}
