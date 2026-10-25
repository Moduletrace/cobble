import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    /**
     * The workspace's crew members (not the coordinator).
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * Reads whose instructions it may set when it's called.
     * `grabCrewWorkers` by default (the coordinator); a workspace admin's
     * are `grabDirectableBots`.
     */
    grabTargets?: () => Promise<BUN_SQLITE_COBBLE_BOTS[]>;
};

type Args = {
    bot_id: number;
    instructions: string;
};

/**
 * Lets the coordinator, or the workspace's admin, set a crew member's
 * instructions for this workspace: how that bot should do its job here.
 */
export default function setWorkspaceInstructionsTool({
    user_id,
    workspace_id,
    workers,
    grabTargets = () => grabCrewWorkers({ workspace_id }),
}: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");

    return {
        name: "set_bot_workspace_instructions",
        description: `Replace a crew member's instructions for this workspace with this full text (markdown): how they should do their job here, on top of their own instructions. Use it when the user tells you how someone should work in this workspace. It replaces what they had for it, so keep what still applies. This is not the bot's own prompt: when the user means who the bot is and what it does everywhere ("its prompt", "its instructions", an empty prompt to fill), use update_bot where you have it. Crew here: ${crew}.`,
        schema: z.object({
            bot_id: z.number().int(),
            instructions: z.string().trim().max(AppData.PromptMaxLength),
        }),
        run: async ({ args }) => {
            const fresh = await grabTargets();
            const worker = fresh.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member here has id ${args.bot_id}. Crew here: ${fresh
                        .map((bot) => `${bot.id}: ${bot.name}`)
                        .join("; ") || "none"}.`,
                );
            }

            await updateWorkspaceBot({
                user_id,
                workspace_id,
                bot_id: worker.id,
                system_prompt: args.instructions,
            });

            return `${worker.name}'s instructions for this workspace are saved. They apply from their next run here.`;
        },
    };
}
