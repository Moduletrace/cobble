import { useEffect, useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { LiveCrewRefreshedEvent } from "@/src/functions/frontend/announce-live-crew";
import useServerEvent from "@/src/hooks/use-server-event";
import type {
    LiveCrewRefreshedDetail,
    WorkspaceCreatedData,
    WorkspaceRemovedData,
    WorkspaceUpdatedData,
    WorkspaceWithActivity,
} from "@/src/types";

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
 * without a reload). Read again as a whole when the user comes back
 * (`cobble:live-crew-refreshed`), like the bots' list.
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
        event: "server:workspace-removed",
        onData: (data: WorkspaceRemovedData) =>
            setLive((prev) => prev.filter((workspace) => workspace.id != data.workspace_id)),
    });

    useServerEvent({
        event: "server:workspace-updated",
        onData: (data: WorkspaceUpdatedData) =>
            setLive((prev) =>
                prev.map((workspace) =>
                    workspace.id == data.workspace_id
                        ? { ...workspace, image_media_id: data.image_media_id || undefined }
                        : workspace,
                ),
            ),
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

    useEffect(() => {
        const onRefresh = (event: Event) => {
            const detail = (event as CustomEvent<LiveCrewRefreshedDetail>).detail;

            if (!detail?.workspaces) return;

            setLive(
                detail.workspaces.map((workspace) =>
                    Number(workspace.id) == open_workspace_id
                        ? { ...workspace, unread: 0 }
                        : workspace,
                ),
            );
        };

        window.addEventListener(LiveCrewRefreshedEvent, onRefresh);

        return () => window.removeEventListener(LiveCrewRefreshedEvent, onRefresh);
    }, [open_workspace_id]);

    return live;
}
