import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import completeBotPlanStep from "@/src/functions/backend/db/bot-plans/complete-bot-plan-step";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import type { HarnessTool } from "../../../types";

type Params = {
    bot_id: number | string;
    session_id: number | string;
    /**
     * The run working the step, kept on it so a report the app never sent
     * puts the step back (`pauseFailedPlanStep`).
     */
    job_id?: number | string;
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
export default function completePlanStepTool({ bot_id, session_id, job_id }: Params): HarnessTool<Args> {
    let completed = false;

    return {
        name: "complete_plan_step",
        description: `Finish the plan's current step, once you have actually done it. Give one or two lines on what it produced (the number, the path, the link). Call it before you write your report: the report is this reply's last message. One step per reply. Never call it for a step you didn't do, and never for one after the current step.`,
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
            if (completed) {
                throw new Error(`You already finished a step of this plan in this reply. One step per reply.`);
            }

            const done = await completeBotPlanStep({
                plan_id: args.plan_id,
                session_id,
                summary: args.summary,
                job_id,
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

            return `Step ${done.index + 1} is done: the card shows it. The next step (step ${(done.next_step ?? 0) + 1}: ${next?.text || ""}) starts when the user answers the card on your report, so don't start it now. Write your report: two or three sentences on what this step produced, and put the card up beside it.`;
        },
    };
}
