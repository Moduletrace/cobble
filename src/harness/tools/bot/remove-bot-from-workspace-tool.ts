import BunSQLite from "@moduletrace/bun-sqlite";
import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import removeBotFromWorkspace from "@/src/functions/backend/db/workspaces/remove-bot-from-workspace";
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
 * Lets the coordinator take a crew member out of one of the user's
 * workspaces. The bot stays on the crew, and its conversation in that
 * workspace is kept for if it's put back. Its access through the
 * workspace's computers ends with it.
 */
export default function removeBotFromWorkspaceTool({
    user_id,
    workers,
    workspaces,
}: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");
    const list = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "remove_bot_from_workspace",
        description: `Take a crew member out of one of the user's workspaces. The bot stays on the crew and can be put back with add_bot_to_workspace; its conversation there is kept. It loses that workspace's context, models and computers, and the user stops seeing it in the workspace. Crew: ${crew || "none"}. Workspaces: ${list || "none"}.`,
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

            const present =
                (
                    await BunSQLite.sql<{ present: number }>({
                        sql: `SELECT 1 AS present FROM workspace_bots WHERE workspace_id = ? AND bot_id = ? LIMIT 1`,
                        values: [workspace.id, worker.id],
                    })
                ).payload?.[0] || null;

            if (!present) {
                return `${worker.name} isn't in ${workspace.name}.`;
            }

            await removeBotFromWorkspace({
                user_id,
                workspace_id: workspace.id,
                bot_id: worker.id,
            });

            /** The workspaces it's in now, so its crew lists drop it at once. */
            const workspace_ids = (
                (
                    await BunSQLite.sql<{ workspace_id: number }>({
                        sql: `SELECT workspace_id FROM workspace_bots WHERE bot_id = ?`,
                        values: [worker.id],
                    })
                ).payload || []
            ).map((row) => Number(row.workspace_id));

            await pushBotUpdated({ bot_id: worker.id, workspace_ids });

            return `${worker.name} is out of ${workspace.name}. It's still on the crew, and its conversation there is kept for if it's put back. It loses that workspace's context, models and computers.`;
        },
    };
}
