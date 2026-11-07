import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import countComputerTaskJobs from "@/src/functions/backend/db/bots-queue/count-computer-task-jobs";
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
    separate?: boolean;
    max_steps?: number;
};

/**
 * Lets a bot queue long-running work for itself. The task runs in the
 * background with the computer's tools and posts its result to the chat.
 * It's a run in the queue (`bots_queue`), not a task on the to-do list
 * (`tasks`), so it's called a run: told "Task #52", bots and users look
 * for it in `list_tasks` and don't find it. While a run is open in the
 * session on that computer a new one is refused unless it's separate
 * work (one task per computer, so a repeat would only wait behind it).
 * Different work is queued then and there with `separate`: nothing runs
 * when a run ends but posting its result, so a bot that said "once that's
 * done I'll start the next one" never did. `max_steps` caps the run's
 * model turns below the install's limit (`params.max_steps`, read by
 * `runBotTask`): a bot told to "keep it to ~20 steps" only wrote it in
 * its brief, and the run searched on for 40 minutes.
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
        description: `Queue work that takes a while or needs a computer. It runs in the background and its result is posted in this chat. It's a run, not a task on the to-do list: list_tasks never shows it, so don't send the user there to find it. Write the instructions as a full brief for yourself: what to do, where, and how you'll know it's done. Runs go one at a time per computer. While one of yours is open here, never start the same work again under another title, but queue different work now with separate: true and it starts as soon as the open one ends. Nothing starts it later but this call, so never tell the user you'll start it once the other run finishes. ${
            computers.length
                ? `Computers you can use: ${listed}. Defaults to ${computers[0]!.id}, the one you're on.`
                : `You have no computer, so the task can't run commands or browse.`
        }`,
        schema: z.object({
            title: z.string().min(1).max(80).describe("A short label, e.g. \"Check the backup logs\""),
            instructions: z.string().min(1).max(8000),
            computer_id: z.number().int().optional(),
            separate: z
                .boolean()
                .optional()
                .describe("For different work while another run of yours is open here on that computer: it's queued and starts when that one ends. Never to retry or redo the open run."),
            max_steps: z
                .number()
                .int()
                .min(1)
                .max(AppData.BotStepLimitMax)
                .optional()
                .describe(
                    "The most model turns the run may take (each turn is one or more tool calls), enforced by the app; leave out for the install's limit. Set it whenever the user asked to keep a run short or cheap, and for lookups and searches (about 15 to 30), so a run that can't find something stops and reports what it tried instead of searching on.",
                ),
        }),
        run: async ({ args }) => {
            const same = await grabOpenBotTask({ bot_id, session_id, title: args.title });

            if (same) {
                throw new Error(
                    `Run #${same.id} "${args.title}" is already ${same.status == "pending" ? "queued" : "under way"}. Don't start it again; its result will be posted here.`,
                );
            }

            const computer_id = args.computer_id ?? computers[0]?.id ?? undefined;

            const open = args.separate ? null : await grabOpenBotTask({ bot_id, session_id, computer_id });

            if (open) {
                throw new Error(
                    `Run #${open.id} "${open.title || "Task"}" is still ${open.status == "pending" ? "queued" : "under way"} here on that computer. If this is the same work, don't start it again: its result will be posted here (the user can Stop it to start over). It's shown what the user writes here between its steps, so a correction or addition to that work reaches it and never calls for another run. If it's different work, call start_task again now with separate: true; it's queued and starts as soon as run #${open.id} ends. Nothing starts it later but you, now, so never tell the user you'll start it once run #${open.id} is done.`,
                );
            }

            const job_id = await enqueueBotJob({
                user_id,
                bot_id,
                session_id,
                title: args.title,
                instructions: args.instructions,
                message_id,
                computer_id: computer_id || undefined,
                params: args.max_steps ? { max_steps: args.max_steps } : undefined,
            });

            const ahead = computer_id ? await countComputerTaskJobs({ computer_id, except_job_id: job_id }) : 0;

            return `Run #${job_id} queued${args.max_steps ? ` with at most ${args.max_steps} steps` : ""}; you'll work on it yourself in the background. It's not on the task list (list_tasks), so never tell the user to look for it there. ${
                ahead
                    ? `The computer has ${ahead} other ${ahead == 1 ? "run" : "runs"} queued or working (they go one at a time), so it waits for ${ahead == 1 ? "it" : "them"} first: tell the user it's queued behind other work, not that it's running. `
                    : ""
            }Tell the user in one sentence, in the first person, what you're doing (e.g. "I'm checking your inbox now. I'll report back when I'm done."); the result will be posted here when it's done.`;
        },
    };
}
