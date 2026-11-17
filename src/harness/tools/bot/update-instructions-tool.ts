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
    /**
     * Whether the run's user manages the crew. A member's run writes the
     * bot's instructions for the workspace it is in and never its core
     * ones: those start every user's prompt, so one member's conversation
     * would rewrite them for everyone else.
     */
    can_manage_crew?: boolean;
};

type Args = {
    instructions: string;
    scope?: "workspace" | "core";
};

const WorkspaceNote = `your instructions for this workspace, under "# Your instructions in ...": yours there, not the workspace's description or context. Keep everything that still applies.`;

/**
 * Lets a bot rewrite its own instructions as it adapts to the user: its
 * core instructions, or in a workspace (by default) its instructions for
 * that workspace. Calls itself only with the crew-manager case in reach
 * (`grabBotTools`), since core instructions are what every user's run of
 * the bot starts from.
 */
export default function updateInstructionsTool({
    user_id,
    bot_id,
    workspace_id,
    can_manage_crew = false,
}: Params): HarnessTool<Args> {
    const instructions = z.string().trim().max(AppData.PromptMaxLength);
    const may_write_core = Boolean(can_manage_crew);

    return {
        name: "update_instructions",
        description:
            !workspace_id
                ? `Replace your core instructions with this full text (markdown): the start of your prompt, before any workspace or memory, shared with every user you work for. Change them only for how you should work for every user you work for, such as a standing rule for your job; a preference of this one user goes in your memory of them (update_memory, scope "user"). Keep everything that still applies.`
                : may_write_core
                  ? `Replace your instructions with this full text (markdown). scope "workspace" (the default) is ${WorkspaceNote} "core" is your core instructions, the start of your prompt in every workspace and your own chat. Both are shared: the workspace's with everyone working in it, your core ones with every user you work for. Change them only for how you should work for all of them, such as a standing rule for your job; a preference of this one user goes in your memory of them (update_memory, scope "user"). Keep everything that still applies.`
                  : `Replace your instructions for this workspace with this full text (markdown). ${WorkspaceNote} They are shared with everyone working here, so change them for how you should work here, never for what one user prefers: that goes in your memory of them (update_memory, scope "user").`,
        schema:
            workspace_id && may_write_core
                ? z.object({
                      instructions: instructions.min(1),
                      scope: z.enum(["workspace", "core"]).default("workspace"),
                  })
                : z.object({ instructions: instructions.min(1) }),
        run: async ({ args }) => {
            const scope = workspace_id && may_write_core ? args.scope : "workspace";

            if (workspace_id && scope != "core") {
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

            if (!may_write_core) {
                return `Your core instructions are shared with every user you work for, so only an admin can change them. Nothing was saved: your instructions for this workspace are the ones you can write here (update_memory, scope "workspace", keeps what you learn about the work itself).`;
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