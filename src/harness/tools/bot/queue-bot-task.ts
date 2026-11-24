import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import countComputerTaskJobs from "@/src/functions/backend/db/bots-queue/count-computer-task-jobs";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import grabOpenBotTask from "@/src/functions/backend/db/bots-queue/grab-open-bot-task";
import grabOpenAskBySession from "@/src/functions/backend/db/asks/grab-open-ask-by-session";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import isComputerDown from "@/src/utils/computer-down";
import type { BrowserRunKind } from "@/src/dict/browser-dict";

export type BotTaskWork = {
    title: string;
    instructions: string;
    computer_id?: number;
    separate?: boolean;
    max_steps?: number;
};

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    message_id?: number | string;
    run_kind?: BrowserRunKind;
    /**
     * The plan whose step this work is: the run works that step and its
     * report ends on the card that moves the plan on.
     */
    plan_id?: number | null;
    work: BotTaskWork;
    /**
     * The tool that asked, so a refusal tells the model to call that tool
     * again rather than one it no longer has.
     */
    tool_name: string;
};

/**
 * Queues a task run for a bot and returns what the call's answer needs: its
 * id, how many runs are ahead on the computer, and the crew request it is
 * part of, if any. Shared by `start_task` (a hand-off inside a task run) and
 * `send_reply` (a reply that starts work and says so in the same turn), so
 * both apply the same guards: no duplicate title, one run per computer
 * unless `separate`, and a computer that's down is refused before anything
 * is queued.
 */
export default async function queueBotTask({
    user_id,
    bot_id,
    session_id,
    computers,
    message_id,
    run_kind,
    plan_id,
    work,
    tool_name,
}: Params): Promise<{ job_id: number; ahead: number; ask_id?: number }> {
    const same = await grabOpenBotTask({ bot_id, session_id, title: work.title });

    if (same) {
        throw new Error(
            `Run #${same.id} "${work.title}" is already ${same.status == "pending" ? "queued" : "under way"}. Don't start it again; its result will be posted here.`,
        );
    }

    const computer_id = work.computer_id ?? computers[0]?.id ?? undefined;

    const open = work.separate ? null : await grabOpenBotTask({ bot_id, session_id, computer_id });

    if (open) {
        throw new Error(
            `Run #${open.id} "${open.title || "Task"}" is still ${open.status == "pending" ? "queued" : "under way"} here on that computer. If this is the same work, don't start it again: its result will be posted here (the user can Stop it to start over). It's shown what the user writes here between its steps, so a correction or addition to that work reaches it and never calls for another run. If it's different work, call ${tool_name} again now with separate: true; it's queued and starts as soon as run #${open.id} ends. Nothing starts it later but you, now, so never tell the user you'll start it once run #${open.id} is done.`,
        );
    }

    const target = computer_id ? await grabComputerTarget({ computer_id }) : null;

    if (target && !target.ready && isComputerDown({ status: target.status })) {
        throw new Error(
            `${computerNotReadyMessage(target)} Nothing was queued: a run there would only fail. Tell the user the computer is down and what you'd do once it's back, and don't say the work is under way.`,
        );
    }

    /**
     * When this run is part of a crew request being answered, it carries the
     * ask_id so its result goes back to the bot that asked, not just to this
     * conversation.
     */
    const ask = await grabOpenAskBySession({ session_id, user_id });

    const job_id = await enqueueBotJob({
        user_id,
        bot_id,
        session_id,
        title: work.title,
        instructions: work.instructions,
        message_id,
        computer_id: computer_id || undefined,
        params: {
            ...(work.max_steps ? { max_steps: work.max_steps } : {}),
            ...(run_kind ? { run_kind } : {}),
            ...(plan_id ? { plan_id: Number(plan_id) } : {}),
            ...(ask?.id ? { ask_id: Number(ask.id) } : {}),
        },
    });

    const ahead = computer_id ? await countComputerTaskJobs({ computer_id, except_job_id: job_id }) : 0;

    return { job_id, ahead, ask_id: ask?.id ? Number(ask.id) : undefined };
}