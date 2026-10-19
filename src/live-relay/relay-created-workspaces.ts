import BunSQLite from "@moduletrace/bun-sqlite";
import type { WorkspaceWithActivity } from "@/src/types";
import pushWorkspaceCreated from "@/src/bots-queue/push-workspace-created";

type Params = {
    /**
     * Unix ms: workspaces created since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:workspace-created` for every workspace created since
 * `since` to the connected users who see it (`pushWorkspaceCreated`), so a
 * workspace another process created still shows in the rail. Pushes are
 * idempotent, so overlapping windows only repeat them.
 */
export default async function relayCreatedWorkspaces({ since, users }: Params) {
    if (!users.size) return;

    const workspaces =
        (
            await BunSQLite.sql<WorkspaceWithActivity>({
                sql: `SELECT w.*, 0 AS unread, NULL AS last_activity_at
                    FROM workspaces w
                    WHERE w.created_at > ? AND w.archived = 0`,
                values: [since],
            })
        ).payload || [];

    for (const workspace of workspaces) {
        await pushWorkspaceCreated({ workspace, users });
    }
}
