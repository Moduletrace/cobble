import { z } from "zod";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabWorkspacePeople from "@/src/functions/backend/db/workspaces/grab-workspace-people";
import workspacePeopleLines from "@/src/utils/workspace-people-lines";
import type { HarnessTool } from "../../types";

type Params = {
    /**
     * The workspaces the coordinator reaches. Read at call time, so one
     * made earlier in the same run is listed too.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The workspace the run is in: the one listed when no id is given.
     */
    workspace_id?: number | string | null;
};

type Args = {
    workspace_id?: number;
};

/**
 * Lets the coordinator see who works in a workspace and each one's role
 * there (`workspace_user_roles`), with the user ids
 * `set_user_workspace_role` takes.
 */
export default function listWorkspacePeopleTool({ workspaces, workspace_id }: Params): HarnessTool<Args> {
    const listed = () => workspaces.map((w) => `${w.id}: ${w.name}`).join("; ") || "none";

    return {
        name: "list_workspace_people",
        description: `List who works in a workspace (super admins and admins work in every one, members only where they were added) with their user ids and each one's role there: what every bot there reads about the user it works for. Read it before set_user_workspace_role.${workspace_id ? " Leave out workspace_id for this workspace." : ""} Workspaces: ${listed()}.`,
        schema: z.object({ workspace_id: z.number().int().optional() }),
        run: async ({ args }) => {
            const target = workspaces.find((w) => w.id == (args.workspace_id || workspace_id));

            if (!target?.id) {
                throw new Error(`No workspace has id ${args.workspace_id ?? "(none given)"}. Workspaces: ${listed()}.`);
            }

            const people = await grabWorkspacePeople({ workspace_id: target.id });

            if (!people.length) return `Nobody works in ${target.name} yet.`;

            return `People in ${target.name} (workspace ${target.id}):\n${workspacePeopleLines({ people })}`;
        },
    };
}
