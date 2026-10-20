import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import grabOpenBotTask from "@/src/functions/backend/db/bots-queue/grab-open-bot-task";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The session the task is started from; its result is posted there.
     */
    session_id: number | string;
    /**
     * The bot's computers, the current one first (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The user message that asked for the work.
     */
    message_id?: number | string;
};

type Args = {
    title: string;
    instructions: string;
    computer_id?: number;
};

/**
 * Lets a bot queue long-running work for itself. The task runs in the
 * background with the computer's tools and posts its result to the chat.
 */
export default function startTaskTool({
    user_id,
    bot_id,
    session_id,
    computers,
    message_id,
}: Params): HarnessTool<Args> {
    const listed = computers
        .map((computer) => `${computer.id} (${computer.name || computer.kind})`)
        .join(", ");

    return {
        name: "start_task",
        description: `Queue work that takes a while or needs a computer. It runs in the background and its result is posted in this chat. Write the instructions as a full brief for yourself: what to do, where, and how you'll know it's done. ${
            computers.length
                ? `Computers you can use: ${listed}. Defaults to ${computers[0]!.id}, the one you're on.`
                : `You have no computer, so the task can't run commands or browse.`
        }`,
        schema: z.object({
            title: z.string().min(1).max(80).describe("A short label, e.g. \"Check the backup logs\""),
            instructions: z.string().min(1).max(8000),
            computer_id: z.number().int().optional(),
        }),
        run: async ({ args }) => {
            const open = await grabOpenBotTask({ bot_id, session_id, title: args.title });

            if (open) {
                throw new Error(
                    `Task #${open.id} "${args.title}" is already ${open.status == "pending" ? "queued" : "under way"}. Don't start it again; its result will be posted here.`,
                );
            }

            const computer_id = args.computer_id ?? computers[0]?.id ?? undefined;

            const job_id = await enqueueBotJob({
                user_id,
                bot_id,
                session_id,
                title: args.title,
                instructions: args.instructions,
                message_id,
                computer_id: computer_id || undefined,
            });

            return `Task #${job_id} queued; you'll work on it yourself in the background. Tell the user in one sentence, in the first person, what you're doing (e.g. "I'm checking your inbox now. I'll report back when I'm done."); the result will be posted here when it's done.`;
        },
    };
}
