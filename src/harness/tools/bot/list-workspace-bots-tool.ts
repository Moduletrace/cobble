import { z } from "zod";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import botRef from "@/src/utils/bot-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
};

type Args = {
    workspace_id: number;
};

/**
 * Lets the coordinator see who works in a workspace from outside it. Read
 * fresh every call, so a workspace or a member another reply just added
 * is already there.
 */
export default function listWorkspaceBotsTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "list_workspace_bots",
        description: `List the bots in a live workspace: each one's ref (its id, e.g. [bot:3]), name, role, whether it's the workspace's admin, and its instructions there. You work in every workspace too, so you aren't listed. Find the workspace's id with find_workspace.`,
        schema: z.object({
            workspace_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const live = await grabUserWorkspaces({ user_id });
            const workspace = live.find((w) => w.id == args.workspace_id);

            if (!workspace?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id}. Workspaces: ${
                        live.map((w) => `${w.id}: ${w.name}`).join("; ") || "none"
                    }.`,
                );
            }

            const bots = (await grabWorkspaceBots({ user_id, workspace_id: workspace.id })).filter(
                (bot) => bot.kind != "coordinator",
            );

            if (!bots.length) {
                return `${workspace.name} has no bots yet.`;
            }

            return bots
                .map((bot) => {
                    const line = `${botRef({ id: bot.id || 0 })} ${bot.name}${bot.role ? ` (${bot.role})` : ""}${bot.is_admin ? `, admin of this workspace` : ""}`;

                    return bot.workspace_system_prompt
                        ? `${line}\n## Instructions here:\n${bot.workspace_system_prompt}`
                        : line;
                })
                .join("\n");
        },
    };
}
