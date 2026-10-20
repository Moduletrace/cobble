import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import pushBotCreated from "@/src/bots-queue/push-bot-created";
import createBot from "@/src/functions/backend/db/bots/create-bot";
import addBotToWorkspace from "@/src/functions/backend/db/workspaces/add-bot-to-workspace";
import pickFreeHue from "@/src/utils/pick-free-hue";
import botRef from "@/src/utils/bot-ref";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's workspaces the new bot can join.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The workspace the conversation is in: the one a new bot joins when
     * none is named.
     */
    workspace_id?: number | string | null;
};

type Args = {
    name: string;
    role: string;
    instructions: string;
    workspace_id?: number;
};

/**
 * Lets the coordinator add a worker bot to the crew, and put it in one of
 * the user's workspaces, so it has a place to work and be talked to.
 * Creating a bot is one of the few structural changes the coordinator
 * makes, so it only runs once the user has agreed.
 */
export default function createBotTool({
    user_id,
    workspaces,
    workspace_id,
}: Params): HarnessTool<Args> {
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");
    const here = workspaces.find((w) => w.id == workspace_id);

    return {
        name: "create_bot",
        description: `Add a worker bot to the crew: give it a short name, its job in one line, and the instructions it keeps (markdown: what it does, how it works, what it handles). A bot works in the workspace it joins, where the user can also talk to it; without one it has no computer or workspace until you give it either. Only do this when the user has asked for it or agreed to it.${here ? ` Leave out workspace_id for ${here.name}, the workspace you're in.` : ""} Workspaces: ${list || "none"}.`,
        schema: z.object({
            name: z.string().trim().min(1).max(40),
            role: z.string().trim().max(120),
            instructions: z.string().trim().min(1).max(AppData.PromptMaxLength),
            workspace_id: z.number().int().optional(),
        }),
        run: async ({ args }) => {
            const target = args.workspace_id
                ? workspaces.find((w) => w.id == args.workspace_id)
                : here;

            if (args.workspace_id && !target?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id}. Workspaces: ${list || "none"}.`,
                );
            }

            const hues =
                (
                    await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                        sql: `SELECT hue FROM bots`,
                        values: [],
                    })
                ).payload || [];

            const bot_id = await createBot({
                user_id,
                name: args.name,
                role: args.role,
                hue: pickFreeHue({ taken: hues.map((bot) => bot.hue) }),
                system_prompt: args.instructions,
            });

            if (target?.id) {
                await addBotToWorkspace({ user_id, workspace_id: target.id, bot_id });
            }

            const created =
                (
                    await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                        sql: `SELECT * FROM bots WHERE id = ?`,
                        values: [bot_id],
                    })
                ).payload?.[0] || null;

            if (created) {
                await pushBotCreated({ bot: created });
            }

            const where = target?.name ? ` and joins ${target.name}` : "";

            return `${args.name} is on the crew (${botRef({ id: bot_id })})${where}.${target ? "" : " It has no workspace yet: put it in one with add_bot_to_workspace, or give it a computer with assign_computer."} assign_computer, add_bot_to_workspace and delegate_task take bot_id ${bot_id} right away, in this same reply.`;
        },
    };
}
