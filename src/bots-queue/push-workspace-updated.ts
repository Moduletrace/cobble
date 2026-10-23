import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabWorkspaceAudience from "@/src/functions/backend/db/access/grab-workspace-audience";
import { logError } from "@/src/functions/backend/logger";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    workspace_id: number | string;
    /**
     * Only these users (the connected ones, for the live relay); else
     * everyone who sees the workspace.
     */
    users?: Set<string>;
};

/**
 * Pushes `server:workspace-updated` to everyone who sees a workspace whose
 * picture changed, so the rail and its header swap it without a reload.
 * Best effort: a push that fails is logged and never fails the change that
 * caused it.
 */
export default async function pushWorkspaceUpdated({ workspace_id, users }: Params) {
    if (!workspace_id) return;

    try {
        const workspace = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
                sql: `SELECT id, image_media_id FROM workspaces WHERE id = ? LIMIT 1`,
                values: [Number(workspace_id)],
            })
        ).payload?.[0];

        if (!workspace?.id) return;

        const data = {
            workspace_id: Number(workspace.id),
            image_media_id: workspace.image_media_id ? Number(workspace.image_media_id) : null,
        };

        for (const user_id of await grabWorkspaceAudience({ workspace_id: workspace.id })) {
            if (users && !users.has(String(user_id))) continue;

            sendToUser({
                user_id,
                data: { event: "server:workspace-updated", data },
            });
        }
    } catch (error) {
        await logError({
            title: "Workspace update wasn't pushed",
            error,
            metadata: { workspace_id },
        }).catch(() => {});
    }
}
