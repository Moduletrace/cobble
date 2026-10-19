import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    workspace_id: number | string;
    /**
     * Everyone who saw the workspace, read before its row was deleted:
     * afterwards its links are gone with it, so its audience can't be
     * worked out any more.
     */
    user_ids: number[];
};

/**
 * Pushes `server:workspace-removed` to everyone who could see a workspace
 * that was deleted, so its rail row goes at once and nothing opens a dead
 * workspace.
 */
export default function pushWorkspaceRemoved({ workspace_id, user_ids }: Params) {
    for (const user_id of user_ids) {
        sendToUser({
            user_id,
            data: {
                event: "server:workspace-removed",
                data: { workspace_id: Number(workspace_id) },
            },
        });
    }
}
