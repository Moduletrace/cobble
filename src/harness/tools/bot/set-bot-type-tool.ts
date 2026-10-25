import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabBotTypes from "@/src/functions/backend/db/bot-types/grab-bot-types";
import removeBotType from "@/src/functions/backend/db/bot-types/remove-bot-type";
import setBotType from "@/src/functions/backend/db/bot-types/set-bot-type";
import botRef from "@/src/utils/bot-ref";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The coordinator: it must be allowed as well as the user
     * (`BotTypeAssignmentMatrix`).
     */
    bot_id: number | string;
    /**
     * The workers it may make admins.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * The workspaces they can lead.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The workspace the conversation is in: the one meant when no id is
     * given.
     */
    workspace_id?: number | string | null;
};

type Args = {
    bot_id: number;
    workspace_id?: number;
    admin: boolean;
};

/**
 * Lets the coordinator make a worker the admin of a workspace it works in,
 * or take that away. An admin hands tasks to the other bots there, sets
 * their instructions there, runs the workspace's task list and keeps its
 * context (`BotTypePermissionMatrix`). Read back before it says it's done.
 */
export default function setBotTypeTool({ user_id, bot_id, workers, workspaces, workspace_id }: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");
    const places = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "set_bot_type",
        description: `Make a worker the admin of a workspace it works in (admin: true), or take that away (admin: false). A workspace admin leads the bots there: it hands them tasks with delegate_task, sets their instructions there, runs the workspace's task list and keeps its context. Only do it once the user asked for it or agreed. Crew: ${crew || "none"}. Workspaces: ${places || "none"}.`,
        schema: z.object({
            bot_id: z.number().int(),
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe(workspace_id ? `Defaults to this workspace (${workspace_id}).` : `The workspace it leads.`),
            admin: z.boolean(),
        }),
        run: async ({ args }) => {
            const target_workspace_id = args.workspace_id || (workspace_id ? Number(workspace_id) : null);

            if (!target_workspace_id) {
                throw new Error(`Name the workspace: ${places || "none"}.`);
            }

            const change = {
                user_id,
                actor_bot_id: bot_id,
                bot_id: args.bot_id,
                bot_type: "admin" as const,
                workspace_id: target_workspace_id,
            };

            const { bot, workspace } = args.admin ? await setBotType(change) : await removeBotType(change);

            const saved = (await grabBotTypes({ bot_id: args.bot_id })).some(
                (bt) => bt.bot_type == "admin" && bt.workspace_id == target_workspace_id,
            );

            if (saved != args.admin) {
                throw new Error(`The change didn't take: check the bot is still in the workspace and try again.`);
            }

            await pushBotUpdated({ bot_id: args.bot_id });

            return args.admin
                ? `${botRef({ id: bot.id || 0 })} is now the admin of "${workspace.name}". It gets the admin's tools from its next reply there.`
                : `${botRef({ id: bot.id || 0 })} is no longer the admin of "${workspace.name}".`;
        },
    };
}
