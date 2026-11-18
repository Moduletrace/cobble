import { z } from "zod";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import findWorkspaceResult from "@/src/utils/find-workspace-result";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The workspace the run is in: only it is listed and read there, since
     * it is the only one the run's tools can change.
     */
    workspace_id?: number | string | null;
};

type Args = {
    workspace_id?: number;
    query?: string;
    limit?: number;
    /**
     * Return the one match's whole context, so it can be kept when it is
     * rewritten.
     */
    include_context?: boolean;
};

/**
 * Lets a bot look up the user's live workspaces: by id, name, description
 * or shared context, and with `include_context` the whole text
 * `update_workspace` replaces, so a bot reads before it writes. Read fresh
 * every call, so a workspace another reply just created is already there.
 */
export default function findWorkspaceTool({ user_id, workspace_id }: Params): HarnessTool<Args> {
    const here = workspace_id ? Number(workspace_id) : null;

    return {
        name: "find_workspace",
        description: `Find a live workspace: by id, name, description, or words in its shared context. Returns each match's id, name and description. With include_context on a single match it also returns that match's whole context (the markdown every bot there gets), which update_workspace replaces whole: read it first when you change it. With no query it lists the workspaces, up to limit.${here ? " Only this workspace is listed: the run works in it." : ""} list_workspace_bots shows who works in one.`,
        schema: z.object({
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe("A workspace id; this workspace when the run is in one"),
            query: z.string().trim().max(200).optional(),
            limit: z.number().int().min(1).max(50).optional(),
            include_context: z
                .boolean()
                .optional()
                .describe("Return the match's whole context, so you can keep it when changing it"),
        }),
        run: async ({ args }) => {
            const live = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);

            return findWorkspaceResult({
                workspaces: live,
                query: args.query,
                limit: args.limit,
                include_context: args.include_context,
                only_workspace_id: args.workspace_id ?? here,
            });
        },
    };
}