import { z } from "zod";
import grabBotPlan from "@/src/functions/backend/db/bot-plans/grab-bot-plan";
import saveBotPlanSteps from "@/src/functions/backend/db/bot-plans/save-bot-plan-steps";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import { BotPlanGoalSchema, BotPlanStepTextsSchema, BotPlanTitleSchema } from "@/src/schemas/bot-plan-schema";
import AppError from "@/src/utils/app-error";
import botPlanRef from "@/src/utils/bot-plan-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    onPlan: (params: { ref: string }) => void;
};

type Args = {
    plan_id: number;
    steps: z.infer<typeof BotPlanStepTextsSchema>;
    title?: string;
    goal?: string;
};

/**
 * The bot changed the plan it is working, because the work showed the plan
 * was wrong. The same rules the user's edits follow hold: a step already
 * done is a record of work that happened, so it stays at the top with its
 * note, and everything after it is the bot's to rewrite.
 */
export default function updatePlanTool({ user_id, bot_id, session_id, onPlan }: Params): HarnessTool<Args> {
    return {
        name: "update_plan",
        description: `Change the plan you're working when what you found makes the rest of it wrong. Send the whole list of steps, in order, the steps already done first and unchanged (their notes are what was worked). Say in your reply what changed and why, in a line. Don't use it to make the plan look finished.`,
        schema: z.object({
            plan_id: z.number().int().positive().describe(`The plan's id, as your prompt gives it`),
            steps: BotPlanStepTextsSchema.describe(`The plan's steps as they should now read, done ones first and unchanged`),
            title: BotPlanTitleSchema.optional().describe(`A new title, only when the work turned out to be something else`),
            goal: BotPlanGoalSchema.describe(`A new goal, only when what "done" means has changed`),
        }),
        run: async ({ args }) => {
            const row = await grabBotPlan({ plan_id: args.plan_id });

            if (Number(row.session_id) != Number(session_id)) {
                throw new AppError(`Plan #${args.plan_id} belongs to another conversation: change that conversation's plan.`);
            }

            await saveBotPlanSteps({
                plan_id: args.plan_id,
                user_id,
                title: args.title?.trim() || row.title || "",
                goal: args.goal?.trim() || row.goal || "",
                steps: args.steps,
            });

            onPlan({ ref: botPlanRef({ plan_id: args.plan_id }) });
            await pushBotPlan({ plan_id: args.plan_id, session_id, bot_id });

            return `Plan #${args.plan_id} is updated and its card shows the new steps. Say in a line what changed and why, then carry on with the step you're on.`;
        },
    };
}