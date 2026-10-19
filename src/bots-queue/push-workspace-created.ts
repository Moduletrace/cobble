import type { WorkspaceWithActivity } from "@/src/types";
import grabWorkspaceAudience from "@/src/functions/backend/db/access/grab-workspace-audience";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    workspace: WorkspaceWithActivity;
    /**
     * Only these users (the connected ones, for the live relay); else
     * everyone who sees the workspace.
     */
    users?: Set<string>;
};

/**
 * Pushes `server:workspace-created` to everyone who sees a workspace that
 * was just created, so it shows in their rail without a reload.
 */
export default async function pushWorkspaceCreated({ workspace, users }: Params) {
    if (!workspace.id) return;

    const data: WorkspaceWithActivity = {
        ...workspace,
        unread: 0,
        last_activity_at: null,
    };

    for (const user_id of await grabWorkspaceAudience({ workspace_id: workspace.id })) {
        if (users && !users.has(String(user_id))) continue;

        sendToUser({
            user_id,
            data: {
                event: "server:workspace-created",
                data: { workspace: data },
            },
        });
    }
}
