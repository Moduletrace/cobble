import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import updateBotSystemPrompt from "@/src/functions/backend/db/bots/update-bot-system-prompt";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import type { HarnessTool } from "../../types";
import checkSavedText from "./check-saved-text";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in: then the bot rewrites its instructions
     * for the workspace unless it picks `core`.
     */
    workspace_id?: number | string | null;
};

type Args = {
    instructions: string;
    scope?: "workspace" | "core";
};

/**
 * Lets a bot rewrite its own instructions as it adapts to the user: its
 * core instructions, or in a workspace (by default) its instructions for
 * that workspace.
 */
export default function updateInstructionsTool({
    user_id,
    bot_id,
    workspace_id,
}: Params): HarnessTool<Args> {
    const instructions = z.string().trim().max(AppData.PromptMaxLength);

    return {
        name: "update_instructions",
        description: workspace_id
            ? `Replace your instructions with this full text (markdown). scope "workspace" (the default) is your instructions for this workspace, under "# Your instructions in ...": yours there, not the workspace's description or context; "core" is your core instructions, the start of your prompt in every workspace and your own chat. Both are shared: the workspace's with everyone working in it, your core ones with every user you work for. Change them only for how you should work for all of them, such as a standing rule for your job; a preference of this one user goes in your memory of them (update_memory, scope "user"). Keep everything that still applies.`
            : `Replace your core instructions with this full text (markdown): the start of your prompt, before any workspace or memory, shared with every user you work for. Change them only for how you should work for every user you work for, such as a standing rule for your job; a preference of this one user goes in your memory of them (update_memory, scope "user"). Keep everything that still applies.`,
        schema: workspace_id
            ? z.object({ instructions, scope: z.enum(["workspace", "core"]).default("workspace") })
            : z.object({ instructions: instructions.min(1) }),
        run: async ({ args }) => {
            if (workspace_id && args.scope != "core") {
                await updateWorkspaceBot({
                    user_id,
                    workspace_id,
                    bot_id,
                    system_prompt: args.instructions,
                });
                await checkSavedText({
                    kind: "workspace_instructions",
                    bot_id,
                    workspace_id,
                    expected: args.instructions,
                });
                return `Instructions for this workspace saved and checked. They apply from your next run here. They are yours in this workspace, not its context: the workspace's own description and context did not change.`;
            }

            await updateBotSystemPrompt({
                user_id,
                bot_id,
                system_prompt: args.instructions,
            });
            await checkSavedText({ kind: "core_instructions", bot_id, expected: args.instructions });
            return `Core instructions saved and checked. They apply from your next run, everywhere.`;
        },
    };
}
