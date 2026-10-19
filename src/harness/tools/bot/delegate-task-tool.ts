import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import insertBotMessage from "@/src/functions/backend/db/bots/insert-bot-message";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The coordinator: the worker's result comes back to its conversation.
     */
    coordinator_id: number | string;
    /**
     * The coordinator's name, shown in the worker's conversation.
     */
    coordinator_name: string;
    /**
     * The user's worker bots.
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
};

type Args = {
    bot_id: number;
    title: string;
    instructions: string;
};

/**
 * Lets the coordinator hand a task to a worker bot. The worker runs it on
 * the computer it's on (if it has one) and posts the result in its own
 * conversation, where a note says who asked; the result (or failure) is
 * also reported back in the coordinator's conversation.
 */
export default function delegateTaskTool({
    user_id,
    coordinator_id,
    coordinator_name,
    workers,
}: Params): HarnessTool<Args> {
    const crew = workers
        .map((bot) => `${bot.id}: ${bot.name}${bot.role ? ` (${bot.role})` : ""}`)
        .join("; ");

    return {
        name: "delegate_task",
        description: `Hand a task to a crew member. They run it in the background and post the result in their own conversation; it's also reported back here when they finish or fail. Write the instructions as a full brief: what to do, where, and how they'll know it's done. Crew: ${crew}.`,
        schema: z.object({
            bot_id: z.number().int(),
            title: z.string().min(1).max(80),
            instructions: z.string().min(1).max(8000),
        }),
        run: async ({ args }) => {
            const worker = workers.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(`No crew member has id ${args.bot_id}. Crew: ${crew}.`);
            }

            const computers = await grabBotComputers({ bot_id: worker.id, user_id });

            const job_id = await enqueueBotJob({
                user_id,
                bot_id: worker.id,
                title: args.title,
                instructions: args.instructions,
                computer_id: computers[0]?.id || undefined,
                requested_by_bot_id: coordinator_id,
            });

            await pushBotNotice({
                bot_id: worker.id,
                message: await insertBotMessage({
                    bot_id: worker.id,
                    text: `${coordinator_name} asked me to: **${args.title}**`,
                }),
            });

            return `Task #${job_id} is with ${worker.name}. Their result will be in their conversation and reported back here.`;
        },
    };
}
