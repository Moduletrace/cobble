import { z } from "zod";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import pushWorkspaceCreated from "@/src/bots-queue/push-workspace-created";
import logEvent from "@/src/functions/backend/logger";
import createWorkspace from "@/src/functions/backend/db/workspaces/create-workspace";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's live workspaces, which the new one is also added to at
     * run time so later tool calls in the same reply can use its id.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    name: string;
    description?: string;
    context?: string;
};

/**
 * Lets the coordinator create a workspace: a place a group of bots works
 * from shared context, with its own computers and models. Creating one is
 * a structural change, so it only runs once the user has asked for it or
 * agreed to it.
 */
export default function createWorkspaceTool({ user_id, workspaces }: Params): HarnessTool<Args> {
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "create_workspace",
        description: `Create a workspace: a place where a group of bots works on one thing, sharing a context every bot there gets in its prompt, its computers and its models. Give it a short name, one line on what it's for, and the context (markdown: what the work is, who it's for, what everyone there should know). It starts empty: put bots in it with add_bot_to_workspace, or pass its id to create_bot. Only do this when the user has asked for it or agreed to it.${list ? ` Workspaces that already exist: ${list}.` : ""}`,
        schema: z.object({
            name: z.string().trim().min(1).max(60),
            description: z.string().trim().max(240).optional(),
            context: z.string().trim().max(AppData.PromptMaxLength).optional(),
        }),
        run: async ({ args }) => {
            const existing = workspaces.find(
                (w) => w.name?.trim().toLowerCase() == args.name.trim().toLowerCase(),
            );

            if (existing?.id) {
                throw new Error(
                    `There's already a workspace called ${existing.name} (#${existing.id}). Change it with update_workspace instead, or pick another name.`,
                );
            }

            const workspace_id = Number(
                await createWorkspace({
                    user_id,
                    name: args.name,
                    description: args.description,
                    system_prompt: args.context,
                }),
            );

            const created = (await grabUserWorkspaces({ user_id })).find(
                (workspace) => workspace.id == workspace_id,
            );

            /**
             * The tool list is built once per reply: adding the row here
             * lets create_bot and add_bot_to_workspace use the new id in
             * the same turn.
             */
            if (created) {
                workspaces.push(created);
            }

            await logEvent({
                title: "Workspace created",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Bot created the workspace ${args.name}.`,
                metadata: { workspace_id },
            });

            if (created) {
                await pushWorkspaceCreated({ workspace: created });
            }

            return `Workspace #${workspace_id} "${args.name}" is ready. The user sees it in their rail. Add bots to it with add_bot_to_workspace, or pass ${workspace_id} to create_bot; its context can change later with update_workspace.`;
        },
    };
}
