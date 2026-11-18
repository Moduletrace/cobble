import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabBotSavedText, {
    type BotSavedTextKind,
} from "@/src/functions/backend/db/bots/grab-bot-saved-text";
import updateBotMemory from "@/src/functions/backend/db/bots/update-bot-memory";
import updateBotUserMemory from "@/src/functions/backend/db/bots/update-bot-user-memory";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import markdownHeadings from "@/src/utils/markdown-headings";
import sharedTextProblem from "@/src/utils/shared-text-guard";
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
    /**
     * Whether the run's user manages the crew: core memory is shared with
     * every user the bot works for, so a member's run writes only what is
     * theirs (`user`) or the workspace's.
     */
    can_manage_crew?: boolean;
};

type Args = {
    memory: string;
    scope?: "user" | "workspace" | "core";
    /**
     * Write the memory even though that drops what it had, which the tool
     * refuses once otherwise.
     */
    replace?: boolean;
};

const UserScopeNote = `what you remember about this user, under "# Memory about the user": their preferences, facts about them and their work, decisions they made. Only runs for this user see it.`;

const CoreScopeNote = `scope "core" is your core memory, under "# Memory", shared with every user you work for: only general knowledge about your job that holds for anyone, never anything about a particular user.`;

const WorkspaceScopeNote = `scope "workspace" (the default) is your own memory for this workspace, under "# Memory in ...": what holds for the work here. It is yours, not the workspace's description or context, which the user sets and which you never change from here. Keep it concise with lasting rules and architecture; never put database dumps, row counts, file contents or full query output in memory (save those to files).`;

const ReplaceNote = `Anything you leave out is forgotten, so include the parts that still matter: a save that would drop a section or cut the text in half is refused once, and \`replace: true\` is how you say dropping it is the point.`;

/**
 * Lets a bot rewrite one of its memories: about the user it works for
 * (the default outside a workspace), for the workspace (the default in
 * one), or its core memory, shared by every user.
 */
export default function updateMemoryTool({
    user_id,
    bot_id,
    workspace_id,
    can_manage_crew = false,
}: Params): HarnessTool<Args> {
    const memory = z.string().max(AppData.PromptMaxLength);
    const may_write_core = Boolean(can_manage_crew);
    const replace = z
        .boolean()
        .optional()
        .describe("Write it even though it drops sections the stored memory has");

    return {
        name: "update_memory",
        description: workspace_id
            ? `Replace a memory with this full text (markdown). ${WorkspaceScopeNote} scope "user" is ${UserScopeNote} ${CoreScopeNote} ${ReplaceNote}`
            : `Replace a memory with this full text (markdown). scope "user" (the default) is ${UserScopeNote} ${CoreScopeNote} ${ReplaceNote}`,
        schema: workspace_id
            ? z.object({
                  memory,
                  scope: z.enum(["workspace", "user", "core"]).default("workspace"),
                  replace,
              })
            : z.object({
                  memory,
                  scope: z.enum(["user", "core"]).default("user"),
                  replace,
              }),
        run: async ({ args }) => {
            /**
             * Every scope replaces its memory whole, so the same guard runs
             * first whichever it is.
             */
            const guard = async (kind: BotSavedTextKind) => {
                const problem = sharedTextProblem({
                    before: await grabBotSavedText({ kind, bot_id, user_id, workspace_id }),
                    after: args.memory,
                    replace: args.replace,
                });

                if (problem) throw new Error(problem);
            };

            const headings = markdownHeadings({ text: args.memory });
            const shape = headings.length
                ? ` It is now ${args.memory.length} characters, in: ${headings.join("; ")}.`
                : ` It is now ${args.memory.length} characters, with no headings.`;

            if (args.scope == "core") {
                /**
                 * Core memory starts every user's run of this bot: one
                 * member's conversation must not rewrite it for the rest.
                 */
                if (!may_write_core) {
                    return `Your core memory is shared with every user you work for, so only an admin can change it. Nothing was saved: what holds for this user goes in your memory of them (scope "user"${workspace_id ? `, or "workspace" for what holds for the work here` : ""}).`;
                }

                await guard("core_memory");
                await updateBotMemory({ user_id, bot_id, memory: args.memory });
                await checkSavedText({ kind: "core_memory", bot_id, expected: args.memory });
                return `Core memory saved and checked.${shape}`;
            }

            if (workspace_id && args.scope == "workspace") {
                await guard("workspace_memory");
                await updateWorkspaceBot({ user_id, workspace_id, bot_id, memory: args.memory });
                await checkSavedText({ kind: "workspace_memory", bot_id, workspace_id, expected: args.memory });
                return `Memory for this workspace saved and checked.${shape} It is your own memory, not the workspace's description or context: those did not change. The user reads it in the workspace's settings, under this bot's row. Tell the user that, never that you changed the workspace.`;
            }

            await guard("user_memory");
            await updateBotUserMemory({ user_id, bot_id, memory: args.memory });
            await checkSavedText({ kind: "user_memory", bot_id, user_id, expected: args.memory });
            return `Memory about the user saved and checked.${shape}`;
        },
    };
}