import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import completeBotPlanStep from "@/src/functions/backend/db/bot-plans/complete-bot-plan-step";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import type { HarnessTool } from "../../../types";

type Params = {
    bot_id: number | string;
    session_id: number | string;
    /**
     * The step is finished inside a run that works the whole plan itself (a
     * routine), so this isn't the reply that ends it: the run carries on
     * into the next step, and one run can finish more than one.
     */
    in_run?: boolean;
};

type Args = {
    plan_id: number;
    summary: string;
};

/**
 * The plan's current step is finished: the card checks it off with what it
 * produced. The next step starts when the user answers the card the report
 * ends on, so a step is only ever finished by a run that did the work, one
 * at a time.
 */
export default function completePlanStepTool({ bot_id, session_id, in_run }: Params): HarnessTool<Args> {
    let completed = false;

    return {
        name: "complete_plan_step",
        description: in_run
            ? `Finish one step of the plan, once you have actually done it, before you start the next. Give one or two lines on what it produced (the number, the path, the link). You work this plan yourself here, so call it after each step and keep going.`
            : `Finish the plan's current step, once you have actually done it. Give one or two lines on what it produced (the number, the path, the link). Call it before you write your report: the report is this reply's last message. One step per reply. Never call it for a step you didn't do, and never for one after the current step.`,
        schema: z.object({
            plan_id: z.number().int().positive().describe(`The plan's id, as your prompt gives it`),
            summary: z
                .string()
                .trim()
                .min(1, `Say what the step produced`)
                .max(
                    AppData.BotPlanStepNoteMaxChars,
                    `Keep it under ${AppData.BotPlanStepNoteMaxChars} characters`,
                )
                .describe(`What the step produced, in a line or two`),
        }),
        run: async ({ args }) => {
            if (completed && !in_run) {
                throw new Error(`You already finished a step of this plan in this reply. One step per reply.`);
            }

            const done = await completeBotPlanStep({
                plan_id: args.plan_id,
                session_id,
                summary: args.summary,
            });

            completed = true;
            /**
             * The card is already in the thread above, from the message that
             * wrote or changed the plan: this reply needs no copy of it, and
             * the push keeps the one that's there current.
             */
            await pushBotPlan({ plan_id: done.plan_id, session_id, bot_id });

            if (done.done) {
                return `Step ${done.index + 1} is done and it was the last one: the plan is finished on its card. Write your report now, two or three sentences on what the plan produced. If this plan will come back (the same work, the next project or the next month), save its steps now with update_memory as a short checklist, and say in a line that you kept them.`;
            }

            const next = done.steps[done.next_step ?? 0];

            if (in_run) {
                return `Step ${done.index + 1} is done: the card shows it. Carry on with step ${(done.next_step ?? 0) + 1}: ${next?.text || ""}. Save your report for the end, when every step is done.`;
            }

            return `Step ${done.index + 1} is done: the card shows it. The next step (step ${(done.next_step ?? 0) + 1}: ${next?.text || ""}) starts when the user answers the card on your report, so don't start it now. Write your report: two or three sentences on what this step produced, and put the card up beside it.`;
        },
    };
}