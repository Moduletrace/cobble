import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotRemoved from "@/src/bots-queue/push-bot-removed";
import grabBotAudience from "@/src/functions/backend/db/access/grab-bot-audience";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import deleteBot from "@/src/functions/backend/db/bots/delete-bot";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The user's worker bots.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
};

type Args = {
    bot_id: number;
};

/**
 * Lets the coordinator delete a crew member with everything it had: its
 * conversations in its own chat and in every workspace, its tasks, its
 * schedules and its workspace places. Its workspaces and computers stay.
 * Irreversible, so it only runs when the user asked for that exact bot to
 * go.
 */
export default function deleteBotTool({ user_id, workers }: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");

    return {
        name: "delete_bot",
        description: `Delete a crew member and everything it had: its conversations in its own chat and in every workspace, its tasks, its schedules and its places in workspaces. Its workspaces and computers stay. This can't be undone. Only do it when the user explicitly asked for this exact bot to be deleted, never as cleanup or to make room, and say what is going with it. Crew: ${crew || "none"}.`,
        schema: z.object({
            bot_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const fresh = await grabCrewWorkers();
            const worker = fresh.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}. Crew: ${fresh
                        .map((bot) => `${bot.id}: ${bot.name}`)
                        .join("; ") || "none"}.`,
                );
            }

            /**
             * Read before the delete: its assignments and workspace places
             * go with it, so who saw it can't be worked out afterwards.
             */
            const audience = await grabBotAudience({ bot_id: worker.id });
            const deleted = await deleteBot({ user_id, bot_id: worker.id });

            pushBotRemoved({ bot_id: worker.id, user_ids: audience });

            await logEvent({
                title: "Bot deleted",
                category: "system",
                user_id: Number(user_id),
                plain_text: `Bot deleted the bot ${deleted.name}.`,
                metadata: { bot_id: worker.id },
            });

            return `${deleted.name || worker.name} is deleted, with its conversations, tasks, schedules and workspace places. The workspaces and computers it used stay.`;
        },
    };
}
