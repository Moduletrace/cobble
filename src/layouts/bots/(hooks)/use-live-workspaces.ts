import { useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import useServerEvent from "@/src/hooks/use-server-event";
import type { WorkspaceCreatedData, WorkspaceWithActivity } from "@/src/types";

type Params = {
    workspaces: WorkspaceWithActivity[];
    /**
     * The workspace open now: its new messages don't mark it unread.
     */
    open_workspace_id?: number;
};

/**
 * The user's workspaces, marked unread as bot messages arrive in them and
 * kept current when one is created (a bot can create one, so it shows
 * without a reload).
 */
export default function useLiveWorkspaces({ workspaces, open_workspace_id }: Params) {
    const [live, setLive] = useState(workspaces);

    useServerEvent({
        event: "server:workspace-created",
        onData: (data: WorkspaceCreatedData) => {
            setLive((prev) => {
                if (prev.some((workspace) => workspace.id == data.workspace.id)) return prev;

                /** The rail lists them oldest first (`grabUserWorkspaces`). */
                const at = prev.findIndex((workspace) => Number(workspace.id) > Number(data.workspace.id));

                if (at < 0) return [...prev, data.workspace];

                return [...prev.slice(0, at), data.workspace, ...prev.slice(at)];
            });
        },
    });

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
