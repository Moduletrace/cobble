import { z } from "zod";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import pushWorkspaceUpdated from "@/src/bots-queue/push-workspace-updated";
import grabPictureSource from "@/src/functions/backend/db/profile-images/grab-picture-source";
import updateWorkspace from "@/src/functions/backend/db/workspaces/update-workspace";
import parseFileRef from "@/src/utils/parse-file-ref";
import type { StorageScope } from "@/src/utils/storage-access";
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
    /**
     * The files this run reaches (`grabRunScopes`): a picture is copied
     * from one of them, so a bot can set the logo it was sent.
     */
    scopes?: StorageScope[];
};

type Args = {
    workspace_id?: number;
    name?: string;
    description?: string;
    context?: string;
    /**
     * A picture for the workspace, from a file the run can see: its
     * `[file:ID]` ref.
     */
    picture_file_id?: string | number | null;
    /**
     * A picture for the workspace: the media id of an image the user
     * uploaded, or null to remove it.
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
    scopes = [],
}: Params): HarnessTool<Args> {
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "update_workspace",
        description: `Change a workspace: its name, its one-line description, its context (markdown every bot working there gets in its prompt), or its picture. Only the fields you give change; \`context\` replaces the whole text, so keep what still applies. Use it when the user asks, or to record something every bot in that workspace must know.${workspace_id ? " Leave out workspace_id for this workspace." : ""} For the picture give \`picture_file_id\` with the image's [file:ID] ref, e.g. "[file:12]" (list_files shows them, and what the user sends you lands in uploads/), or \`picture_media_id\` for an image they uploaded; null removes it. An SVG or another kind of file is turned into a PNG first, then that file is used. Workspaces: ${list}.`,
        schema: z
            .object({
                workspace_id: z.number().int().optional(),
                name: z.string().trim().min(1).max(60).optional(),
                description: z.string().trim().max(240).optional(),
                context: z.string().trim().max(AppData.PromptMaxLength).optional(),
                picture_file_id: z
                    .union([z.string().max(60), z.number().int().positive()])
                    .nullable()
                    .optional()
                    .describe(`The picture's [file:ID] ref, e.g. "[file:12]"`),
                picture_media_id: z
                    .number()
                    .int()
                    .positive()
                    .nullable()
                    .optional()
                    .describe(
                        `An image the user uploaded, by media id; null removes the picture. Leave it out to keep the one it has.`,
                    ),
            })
            .refine(
                (args) =>
                    args.name !== undefined ||
                    args.description !== undefined ||
                    args.context !== undefined ||
                    args.picture_file_id !== undefined ||
                    args.picture_media_id !== undefined,
                "Give a name, a description, a context or a picture to change.",
            ),
        run: async ({ args }) => {
            const target = workspaces.find((w) => w.id == (args.workspace_id || workspace_id));

            if (!target?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id ?? "(none given)"}. Workspaces: ${list}.`,
                );
            }

            const removing =
                args.picture_file_id === null || args.picture_media_id === null;

            /**
             * A file ref is resolved against the run's directories
             * (`grabPictureSource`), so a bot can only set what it could
             * already read.
             */
            const picture_source =
                args.picture_file_id === undefined || args.picture_file_id === null
                    ? null
                    : await grabPictureSource({
                          user_id,
                          scopes,
                          file_id: parseFileRef({ ref: args.picture_file_id }),
                      });

            await updateWorkspace({
                user_id,
                workspace_id: target.id,
                data: {
                    name: args.name,
                    description: args.description,
                    system_prompt: args.context,
                    image_media_id: args.picture_media_id,
                    picture_source,
                },
            });

            /**
             * Its picture reaches every open tab on its own, whether the
             * run is in this process or another (`pushWorkspaceUpdated`,
             * `liveRelay`).
             */
            if (removing || picture_source) {
                await pushWorkspaceUpdated({ workspace_id: target.id });
            }

            const picture = removing
                ? ` Its picture is removed.`
                : picture_source
                  ? ` Its picture is set from that file.`
                  : "";

            return `${args.name || target.name} is saved. Bots there get the change from their next run.${picture}`;
        },
    };
}
