import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import pushBotCreated from "@/src/bots-queue/push-bot-created";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import addBotToWorkspace from "@/src/functions/backend/db/workspaces/add-bot-to-workspace";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's worker bots.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * The user's live workspaces.
     */
    workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    bot_id: number;
    workspace_id: number;
};

/**
 * Lets the coordinator put a crew member in one of the user's workspaces,
 * so the user can talk to it there and it gets that workspace's context,
 * computers and models. Offered in the coordinator's own chat only, where
 * the whole crew and every live workspace are known.
 */
export default function addBotToWorkspaceTool({
    user_id,
    workers,
    workspaces,
}: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "add_bot_to_workspace",
        description: `Put a crew member in one of the user's workspaces. There they work with the workspace's context, its computers and its models, and the user chats with them in it. Use it when the user asks for a bot to work in a workspace, or after create_bot made one without a place. Crew: ${crew || "none"}. Workspaces: ${list || "none"}.`,
        schema: z.object({
            bot_id: z.number().int(),
            workspace_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const fresh = await grabCrewWorkers();
            const live = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);
            const worker = fresh.find((bot) => bot.id == args.bot_id);
            const workspace = live.find((w) => w.id == args.workspace_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}. Crew: ${fresh
                        .map((bot) => `${bot.id}: ${bot.name}`)
                        .join("; ") || "none"}.`,
                );
            }

            if (!workspace?.id) {
                throw new Error(
                    `No workspace has id ${args.workspace_id}. Workspaces: ${
                        live.map((w) => `${w.id}: ${w.name}`).join("; ") || "none"
                    }.`,
                );
            }

            const already =
                (
                    await BunSQLite.sql<{ present: number }>({
                        sql: `SELECT 1 AS present FROM workspace_bots WHERE workspace_id = ? AND bot_id = ? LIMIT 1`,
                        values: [workspace.id, worker.id],
                    })
                ).payload?.[0] || null;

            if (already) {
                return `${worker.name} is already in ${workspace.name}.`;
            }

            await addBotToWorkspace({
                user_id,
                workspace_id: workspace.id,
                bot_id: worker.id,
            });

            await pushBotCreated({ bot: worker });

            return `${worker.name} joined ${workspace.name}.`;
        },
    };
}
