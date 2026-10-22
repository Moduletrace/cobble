import { z } from "zod";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import updateWorkspace from "@/src/functions/backend/db/workspaces/update-workspace";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's workspaces the coordinator may change.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The workspace the conversation is in: the one changed when no id is
     * given.
     */
    workspace_id?: number | string | null;
};

type Args = {
    workspace_id?: number;
    name?: string;
    description?: string;
    context?: string;
    /**
     * A picture for the workspace: the media id the user uploaded, or null
     * to remove it.
     */
    picture_media_id?: number | null;
};

/**
 * Lets the coordinator change a workspace's record: its name, its
 * one-line description and the context every bot working there gets, and
 * its picture.
 */
export default function updateWorkspaceTool({
    user_id,
    workspaces,
    workspace_id,
}: Params): HarnessTool<Args> {
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "update_workspace",
        description: `Change a workspace: its name, its one-line description, its context (markdown every bot working there gets in its prompt), or its picture. Only the fields you give change; \`context\` replaces the whole text, so keep what still applies. Use it when the user asks, or to record something every bot in that workspace must know.${workspace_id ? " Leave out workspace_id for this workspace." : ""} Workspaces: ${list}.`,
        schema: z.object({
            workspace_id: z.number().int().optional(),
            name: z.string().trim().min(1).max(60).optional(),
            description: z.string().trim().max(240).optional(),
            context: z.string().trim().max(AppData.PromptMaxLength).optional(),
            picture_media_id: z
                .number()
                .int()
                .positive()
                .nullable()
                .optional()
                .describe(
                    `An image the user uploaded, by media id; null removes the picture. Leave it out to keep the one it has.`,
                ),
        }),
        run: async ({ args }) => {
            const target = workspaces.find((w) => w.id == (args.workspace_id || workspace_id));

            if (!target?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id ?? "(none given)"}. Workspaces: ${list}.`,
                );
            }

            if (
                args.name === undefined &&
                args.description === undefined &&
                args.context === undefined &&
                args.picture_media_id === undefined
            ) {
                throw new Error(
                    `Give a name, a description, a context or a picture to change.`,
                );
            }

            await updateWorkspace({
                user_id,
                workspace_id: target.id,
                data: {
                    name: args.name,
                    description: args.description,
                    system_prompt: args.context,
                    image_media_id: args.picture_media_id,
                },
            });

            return `${args.name || target.name} is saved. Bots there get the change from their next run.`;
        },
    };
}
