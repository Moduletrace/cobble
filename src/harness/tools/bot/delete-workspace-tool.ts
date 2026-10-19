import { z } from "zod";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import pushWorkspaceRemoved from "@/src/bots-queue/push-workspace-removed";
import grabWorkspaceAudience from "@/src/functions/backend/db/access/grab-workspace-audience";
import deleteWorkspace from "@/src/functions/backend/db/workspaces/delete-workspace";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's live workspaces.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    workspace_id: number;
};

/**
 * Lets the coordinator delete a workspace with its conversations, tasks,
 * schedules and links. Its bots and computers stay, just not in it any
 * more. Irreversible, so it only runs when the user asked for that exact
 * workspace to go.
 */
export default function deleteWorkspaceTool({
    user_id,
    workspaces,
}: Params): HarnessTool<Args> {
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "delete_workspace",
        description: `Delete a workspace with its conversations, tasks, schedules and links to bots and computers. Its bots and computers stay; they're just not in it any more. This can't be undone. Only do it when the user explicitly asked for this exact workspace to be deleted, never as cleanup or to make room, and say what is going with it. Workspaces: ${list || "none"}.`,
        schema: z.object({
            workspace_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const live = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);
            const workspace = live.find((w) => w.id == args.workspace_id);

            if (!workspace?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id}. Workspaces: ${
                        live.map((w) => `${w.id}: ${w.name}`).join("; ") || "none"
                    }.`,
                );
            }

            /**
             * Read before the delete: its links go with it, so who saw it
             * can't be worked out afterwards.
             */
            const audience = await grabWorkspaceAudience({ workspace_id: workspace.id });
            const deleted = await deleteWorkspace({ user_id, workspace_id: workspace.id });

            pushWorkspaceRemoved({ workspace_id: workspace.id, user_ids: audience });

            await logEvent({
                title: "Workspace deleted",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Bot deleted the workspace ${deleted.name}.`,
                metadata: { workspace_id: workspace.id },
            });

            return `${deleted.name || workspace.name} is deleted, with its conversations, tasks, schedules and links. The bots and computers that were in it stay.`;
        },
    };
}
