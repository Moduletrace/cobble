import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import updateBotMemory from "@/src/functions/backend/db/bots/update-bot-memory";
import updateBotUserMemory from "@/src/functions/backend/db/bots/update-bot-user-memory";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import type { HarnessTool } from "../../types";
import checkSavedText from "./check-saved-text";

type Params = {
    /**
     * The user the run is for: `user` memory is theirs alone.
     */
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in: then the bot rewrites its memory for
     * the workspace unless it picks another scope.
     */
    workspace_id?: number | string | null;
};

type Args = {
    memory: string;
    scope?: "user" | "workspace" | "core";
};

const UserScopeNote = `what you remember about this user, under "# Memory about the user": their preferences, facts about them and their work, decisions they made. Only runs for this user see it.`;

const CoreScopeNote = `scope "core" is your core memory, under "# Memory", shared with every user you work for: only general knowledge about your job that holds for anyone, never anything about a particular user.`;

const WorkspaceScopeNote = `scope "workspace" (the default) is your own memory for this workspace, under "# Memory in ...": what holds for the work here. It is yours, not the workspace's description or context, which the user sets and which you never change from here.`;

const ReplaceNote = `Anything you leave out is forgotten, so include the parts that still matter.`;

/**
 * Lets a bot rewrite one of its memories: about the user it works for
 * (the default outside a workspace), for the workspace (the default in
 * one), or its core memory, shared by every user.
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
            ? `Replace a memory with this full text (markdown). ${WorkspaceScopeNote} scope "user" is ${UserScopeNote} ${CoreScopeNote} ${ReplaceNote}`
            : `Replace a memory with this full text (markdown). scope "user" (the default) is ${UserScopeNote} ${CoreScopeNote} ${ReplaceNote}`,
        schema: workspace_id
            ? z.object({ memory, scope: z.enum(["workspace", "user", "core"]).default("workspace") })
            : z.object({ memory, scope: z.enum(["user", "core"]).default("user") }),
        run: async ({ args }) => {
            if (args.scope == "core") {
                await updateBotMemory({ user_id, bot_id, memory: args.memory });
                await checkSavedText({ kind: "core_memory", bot_id, expected: args.memory });
                return `Core memory saved and checked.`;
            }

            if (workspace_id && args.scope == "workspace") {
                await updateWorkspaceBot({ user_id, workspace_id, bot_id, memory: args.memory });
                await checkSavedText({ kind: "workspace_memory", bot_id, workspace_id, expected: args.memory });
                return `Memory for this workspace saved and checked. It is your own memory, not the workspace's description or context: those did not change. The user reads it in the workspace's settings, under this bot's row. Tell the user that, never that you changed the workspace.`;
            }

            await updateBotUserMemory({ user_id, bot_id, memory: args.memory });
            await checkSavedText({ kind: "user_memory", bot_id, user_id, expected: args.memory });
            return `Memory about the user saved and checked.`;
        },
    };
}
