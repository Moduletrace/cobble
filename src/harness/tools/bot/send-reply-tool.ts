import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { BrowserRunKind } from "@/src/dict/browser-dict";
import { ReplyStatuses } from "@/src/dict/reply-status-dict";
import hasOpenWork from "@/src/functions/backend/db/bots-queue/has-open-work";
import type { HarnessTool } from "../../types";
import queueBotTask, { type BotTaskWork } from "./queue-bot-task";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    message_id?: number | string;
    /**
     * The run this call ends, so a task report doesn't count its own job as
     * work that is still open.
     */
    job_id?: number | string;
    run_kind?: BrowserRunKind;
    /**
     * Called with the run `work` queued, so the run that wrote the message
     * can cancel it if the review refuses that message.
     */
    onQueue?: (params: { job_id: number }) => void;
    /**
     * Plan mode: the answer plans, and nothing runs after it. `work` is
     * not part of the call and `working` is refused, so a planning run
     * can't queue the work it was only meant to plan.
     */
    plan_mode?: boolean;
    /**
     * The plan whose step this reply works: the work it queues carries the
     * plan, so its report ends on the card that moves the plan on.
     */
    plan_id?: number | null;
};

type Args = {
    status?: (typeof ReplyStatuses)[number];
    work?: BotTaskWork;
    message?: string;
    text?: string;
};

/**
 * The one way a reply or a task report ends. The text written beside this
 * call or passed in message/text is the message the user gets; the call declares what happens after
 * it, so the app never has to guess intent from prose.
 *
 * `done` says nothing runs once the message is out. `working` says a run
 * carries the work on, and passes `work` to queue it in the same turn, or
 * names a run that is already open. `blocked` says the work cannot go on.
 * A message that says work is under way with `done` is refused by the
 * review, and a `working` message with no run behind it is refused here.
 */
export default function sendReplyTool({
    user_id,
    bot_id,
    session_id,
    computers,
    message_id,
    job_id,
    run_kind,
    onQueue,
    plan_mode,
    plan_id,
}: Params): HarnessTool<Args> {
    let queued: { job_id: number; ahead: number; ask_id?: number } | null = null;

    const listed = computers
        .map((computer) => `${computer.id} (${computer.name || computer.kind})`)
        .join(", ");

    return {
        name: "send_reply",
        description: `${plan_mode ? "Plan mode is on: this reply plans and reads, and changes nothing. Write the plan or the answer, ask when a choice is the user's, and never queue work: status working and work are refused. " : ""}End every reply with this call, in the same turn as the message. The text you write beside it, or in message/text, is what the user gets; a call with neither sends nothing. A message written beside a card in an earlier turn is kept for the send_reply that closes it; anything else written earlier is not filled in. This call only says what happens after it. status done: nothing runs once the message goes out, so the text must not say work is under way. status working: a run is carrying the work on and its result will be posted here; pass work to queue it now, or it must already be open. status blocked: the work cannot go on, and the text says why. Never write a message that says work is under way and end with done. In this same turn, and no other, you may also call suggest_next_steps or ask_user when one of them belongs with the answer. No other tool shares this turn. A message sent without this call is a draft and never reaches the user. Finish every table, list and code fence in the text. ${
            computers.length
                ? `Computers you can use: ${listed}. Defaults to ${computers[0]!.id}, the one you're on.`
                : `You have no computer, so work that needs one can't run.`
        }`,
        schema: plan_mode
            ? z.object({
                  status: z
                      .enum(["done", "blocked"])
                      .default("done")
                      .describe("Plan mode: done sends the plan or answer, blocked says what stopped the work. Work is never queued in plan mode."),
                  message: z
                      .string()
                      .optional()
                      .describe("The message to send the user with this reply, when not written directly in the assistant turn."),
                  text: z
                      .string()
                      .optional()
                      .describe("Alias for message: the message to send the user with this reply."),
              })
            : z.object({
                  status: z
                      .enum(ReplyStatuses)
                      .default("done")
                      .describe("done: nothing runs after this message. working: a run carries the work on. blocked: the work cannot go on."),
                  work: z
                      .object({
                          title: z.string().min(1).max(80).describe("A short label, e.g. \"Check the backup logs\""),
                          instructions: z.string().min(1).max(8000),
                          computer_id: z.number().int().optional(),
                          separate: z
                              .boolean()
                              .optional()
                              .describe(
                                  "For different work while another run of yours is open here on that computer: it's queued and starts when that one ends. Never to retry or redo the open run.",
                              ),
                          max_steps: z
                              .number()
                              .int()
                              .min(1)
                              .max(AppData.BotStepLimitMax)
                              .optional()
                              .describe(
                                  "The most model turns the run may take (each turn is one or more tool calls), enforced by the app; leave out for the install's limit. Set it whenever the user asked to keep a run short or cheap, and for lookups and searches (about 15 to 30), so a run that can't find something stops and reports what it tried instead of searching on.",
                              ),
                      })
                      .optional()
                      .describe("The run to start with this message. Required when status is working and no run of yours is open here."),
                  message: z
                      .string()
                      .optional()
                      .describe("The message to send the user with this reply, when not written directly in the assistant turn."),
                  text: z
                      .string()
                      .optional()
                      .describe("Alias for message: the message to send the user with this reply."),
              }),
        run: async ({ args }) => {
            const status = args.status ?? (args.work ? "working" : "done");

            if (plan_mode && (status === "working" || args.work)) {
                throw new Error(
                    `Plan mode is on for this reply: it plans and reads, and starts nothing. Nothing was queued and nothing was sent. Write the plan or the answer with status "done", or say what stopped the work with "blocked".`,
                );
            }

            if (status !== "working" && args.work) {
                throw new Error(`work can only be passed with status "working": it queues a run, so the message must say that work is under way. Nothing was sent.`);
            }

            if (status === "working") {
                if (args.work) {
                    if (!queued) {
                        queued = await queueBotTask({
                            user_id,
                            bot_id,
                            session_id,
                            computers,
                            message_id,
                            run_kind,
                            plan_id,
                            tool_name: "send_reply",
                            work: args.work,
                        });

                        onQueue?.({ job_id: queued.job_id });
                    }

                    return `Run #${queued.job_id} queued${args.work.max_steps ? ` with at most ${args.work.max_steps} steps` : ""}; you'll work on it yourself in the background. It's not on the task list (list_tasks), so never tell the user to look for it there. ${
                        queued.ahead
                            ? `The computer has ${queued.ahead} other ${queued.ahead == 1 ? "run" : "runs"} queued or working (they go one at a time), so it waits for ${queued.ahead == 1 ? "it" : "them"} first: your message should say it's queued behind other work, not that it's running. `
                            : ""
                    }Your message beside this call goes out with it: say in one sentence, in the first person, what you're doing (e.g. "I'm checking your inbox now. I'll report back when I'm done.").`;
                }

                const open = await hasOpenWork({ bot_id, session_id, exclude_job_id: job_id });

                if (!open) {
                    throw new Error(
                        `Nothing of yours is running in this conversation, so status "working" would be a promise with nothing behind it. Pass work to queue it now, or end with status "done" and write the answer. Nothing was sent.`,
                    );
                }

                return `A run of yours is still open here, so status "working" holds. Your message beside this call goes out with it: say what it's doing, in one sentence, and that its result will be posted here.`;
            }

            if (status === "blocked") {
                return `Your message beside this call goes out, marked blocked. Say plainly what stopped the work and what you need from the user to go on.`;
            }

            return `Your message beside this call goes out, marked done. Nothing runs after it, so it must not say work is under way or that a report will follow.`;
        },
    };
}