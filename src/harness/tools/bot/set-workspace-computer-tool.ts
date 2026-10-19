import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import setWorkspaceComputer from "@/src/functions/backend/db/workspaces/set-workspace-computer";
import computerRef from "@/src/utils/computer-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    /**
     * The workspace's computers, the default first.
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
};

type Args = {
    computer_id: number;
};

/**
 * Lets a bot working in a workspace switch the workspace's default
 * computer, where its tasks run from then on.
 */
export default function setWorkspaceComputerTool({
    user_id,
    workspace_id,
    computers,
}: Params): HarnessTool<Args> {
    const listed = computers
        .map((c) => `${computerRef({ id: c.id || 0 })} ${c.name || "Computer"}`)
        .join(", ");

    return {
        name: "set_workspace_computer",
        description: `Make another of this workspace's computers its default, where tasks here run from now on (for the whole crew). Do it when the work needs that computer; say so to the user. Computers: ${listed}. The default now is ${computerRef({ id: computers[0]?.id || 0 })}.`,
        schema: z.object({
            computer_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const { computer } = await setWorkspaceComputer({
                user_id,
                workspace_id,
                computer_id: args.computer_id,
            });

            return `${computerRef({ id: computer.id || 0 })} is the workspace's default computer now. Tasks you start from here on run there.`;
        },
    };
}
