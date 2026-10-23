import BunSQLite from "@moduletrace/bun-sqlite";
import pushWorkspaceUpdated from "@/src/bots-queue/push-workspace-updated";

type Params = {
    /**
     * Unix ms: workspaces updated since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:workspace-updated` for every workspace changed since
 * `since` to the connected users who see it (`pushWorkspaceUpdated`), so a
 * picture another process set still lands here. Pushes are idempotent, so
 * overlapping windows only repeat them.
 */
export default async function relayChangedWorkspaces({ since, users }: Params) {
    if (!users.size) return;

    const workspaces =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM workspaces WHERE updated_at > ? AND archived = 0`,
                values: [since],
            })
        ).payload || [];

    for (const workspace of workspaces) {
        if (!workspace.id) continue;

        await pushWorkspaceUpdated({ workspace_id: workspace.id, users });
    }
}
