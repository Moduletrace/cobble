import { useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import useServerEvent from "@/src/hooks/use-server-event";
import type { WorkspaceWithActivity } from "@/src/types";

type Params = {
    workspaces: WorkspaceWithActivity[];
    /**
     * The workspace open now: its new messages don't mark it unread.
     */
    open_workspace_id?: number;
};

/**
 * The user's workspaces, marked unread as bot messages arrive in them.
 */
export default function useLiveWorkspaces({ workspaces, open_workspace_id }: Params) {
    const [live, setLive] = useState(workspaces);

    useServerEvent({
        event: "server:bot-message",
        onData: (message: BUN_SQLITE_COBBLE_BOT_MESSAGES) => {
            if (message.author != "bot" || !message.workspace_id) return;
            if (message.workspace_id == open_workspace_id) return;

            setLive((prev) =>
                prev.map((workspace) =>
                    workspace.id == message.workspace_id ? { ...workspace, unread: 1 } : workspace,
                ),
            );
        },
    });

    return live;
}
