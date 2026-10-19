import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import updateBotMemory from "@/src/functions/backend/db/bots/update-bot-memory";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in: then the bot rewrites its memory for
     * the workspace unless it picks `core`.
     */
    workspace_id?: number | string | null;
};

type Args = {
    memory: string;
    scope?: "workspace" | "core";
};

/**
 * Lets a bot rewrite its own memory: its core memory (under `# Memory`),
 * or in a workspace (by default) its memory for that workspace.
 */
export default function updateMemoryTool({
    user_id,
    bot_id,
    workspace_id,
}: Params): HarnessTool<Args> {
    const memory = z.string().max(AppData.PromptMaxLength);

    return {
        name: "update_memory",
        description: workspace_id
            ? `Replace a memory with this full text (markdown). scope "workspace" (the default) is your memory for this workspace, under "# Memory in ..."; "core" is your core memory, under "# Memory", in every workspace and your own chat. Keep what you must always remember: the user's preferences, facts about their work, decisions made. Anything you leave out is forgotten, so include the parts that still matter.`
            : `Replace your memory with this full text (markdown). It's in your prompt under "# Memory" on every run. Keep what you must always remember: the user's preferences, facts about their work, decisions made. Anything you leave out is forgotten, so include the parts that still matter.`,
        schema: workspace_id
            ? z.object({ memory, scope: z.enum(["workspace", "core"]).default("workspace") })
            : z.object({ memory }),
        run: async ({ args }) => {
            if (workspace_id && args.scope != "core") {
                await updateWorkspaceBot({ user_id, workspace_id, bot_id, memory: args.memory });
                return `Memory for this workspace saved.`;
            }

            await updateBotMemory({ user_id, bot_id, memory: args.memory });
            return `Core memory saved.`;
        },
    };
}
