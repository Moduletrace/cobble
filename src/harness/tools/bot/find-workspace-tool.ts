import { z } from "zod";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
};

type Args = {
    query?: string;
    limit?: number;
};

/**
 * Lets the coordinator look up the user's live workspaces: by id, name,
 * description or shared context, so it can find the one to change or
 * delete. Read fresh every call, so a workspace another reply just
 * created is already there.
 */
export default function findWorkspaceTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "find_workspace",
        description: `Find a live workspace: by id, name, description, or words in its shared context. Returns each match's id, name and description. With no query it lists them, up to limit.`,
        schema: z.object({
            query: z.string().trim().max(200).optional(),
            limit: z.number().int().min(1).max(50).optional(),
        }),
        run: async ({ args }) => {
            const live = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);

            const query = (args.query || "").trim().toLowerCase();

            const matches = (
                query
                    ? live.filter((workspace) =>
                          [
                              workspace.id ? String(workspace.id) : "",
                              workspace.name,
                              workspace.description,
                              workspace.system_prompt,
                          ].some((field) => (field || "").toLowerCase().includes(query)),
                      )
                    : live
            ).slice(0, args.limit ?? 20);

            if (!matches.length) {
                return `No workspace matches "${args.query || ""}".`;
            }

            return matches
                .map(
                    (workspace) =>
                        `#${workspace.id} ${workspace.name}${workspace.description ? ` - ${workspace.description}` : ""}`,
                )
                .join("\n");
        },
    };
}
