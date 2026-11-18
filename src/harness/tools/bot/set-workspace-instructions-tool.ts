import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import grabBotSavedText from "@/src/functions/backend/db/bots/grab-bot-saved-text";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import markdownHeadings from "@/src/utils/markdown-headings";
import sharedTextProblem from "@/src/utils/shared-text-guard";
import type { HarnessTool } from "../../types";
import checkSavedText from "./check-saved-text";

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
    /**
     * Write the text even though that drops what it had, which the tool
     * refuses once otherwise.
     */
    replace?: boolean;
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
        description: `Replace a crew member's instructions for this workspace with this full text (markdown): how they should do their job here, on top of their own instructions. Use it when the user tells you how someone should work in this workspace. It replaces what they had for it, so keep what still applies: a save that would drop a section or cut the text in half is refused once, and \`replace: true\` is how you say dropping it is the point. This is not the bot's own prompt: when the user means who the bot is and what it does everywhere ("its prompt", "its instructions", an empty prompt to fill), use update_bot where you have it. Crew here: ${crew}.`,
        schema: z.object({
            bot_id: z.number().int(),
            instructions: z.string().trim().max(AppData.PromptMaxLength),
            replace: z
                .boolean()
                .optional()
                .describe("Write it even though it drops sections the stored text has"),
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

            const before = await grabBotSavedText({
                kind: "workspace_instructions",
                bot_id: worker.id,
                workspace_id,
            });

            const problem = sharedTextProblem({
                before,
                after: args.instructions,
                replace: args.replace,
            });

            if (problem) throw new Error(problem);

            await updateWorkspaceBot({
                user_id,
                workspace_id,
                bot_id: worker.id,
                system_prompt: args.instructions,
            });

            await checkSavedText({
                kind: "workspace_instructions",
                bot_id: worker.id,
                workspace_id,
                expected: args.instructions,
            });

            const headings = markdownHeadings({ text: args.instructions });
            const shape = headings.length
                ? ` Its text is now ${args.instructions.length} characters, in: ${headings.join("; ")}.`
                : ` Its text is now ${args.instructions.length} characters, with no headings.`;

            return `${worker.name}'s instructions for this workspace are saved and checked.${shape} They apply from their next run here.`;
        },
    };
}