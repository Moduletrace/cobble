import { z } from "zod";
import grabBotPlan from "@/src/functions/backend/db/bot-plans/grab-bot-plan";
import saveBotPlanSteps from "@/src/functions/backend/db/bot-plans/save-bot-plan-steps";
import setBotPlanStatus from "@/src/functions/backend/db/bot-plans/set-bot-plan-status";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import { BotPlanGoalSchema, BotPlanStepTextsSchema, BotPlanTitleSchema } from "@/src/schemas/bot-plan-schema";
import AppError from "@/src/utils/app-error";
import botPlanRef from "@/src/utils/bot-plan-ref";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    onPlan: (params: { ref: string }) => void;
};

type Args = {
    plan_id: number;
    steps?: z.infer<typeof BotPlanStepTextsSchema>;
    title?: string;
    goal?: string;
    status?: "paused" | "active";
};

/**
 * The bot changed the plan it is working, because the work showed the plan
 * was wrong. The same rules the user's edits follow hold: a step already
 * done is a record of work that happened, so it stays at the top with its
 * note, and everything after it is the bot's to rewrite.
 *
 * It also parks and picks the plan up, when the user asked: a typed answer
 * to the plan's card is the bot's to read, and a cancel is never the right
 * reading of "pause" (one production bot ended a plan the user had only
 * paused, because pausing was not a thing it could do). Approval and
 * ending stay on the card.
 */
export default function updatePlanTool({ user_id, bot_id, session_id, onPlan }: Params): HarnessTool<Args> {
    return {
        name: "update_plan",
        description: `Change the plan you're working: rewrite its steps when what you found makes the rest of it wrong (send the whole list, in order, the steps already done first and unchanged: their notes are what was worked), or set its status to "paused" or "active" when the user asked to park the plan or pick it back up. Say in your reply what changed and why, in a line. Don't use it to make the plan look finished, and don't pause or resume on your own judgement: only when the message asked.`,
        schema: z.object({
            plan_id: z.number().int().positive().describe(`The plan's id, as your prompt gives it`),
            steps: BotPlanStepTextsSchema.optional().describe(`The plan's steps as they should now read, done ones first and unchanged`),
            title: BotPlanTitleSchema.optional().describe(`A new title, only when the work turned out to be something else`),
            goal: BotPlanGoalSchema.optional().describe(`A new goal, only when what "done" means has changed`),
            status: z
                .enum(["paused", "active"])
                .optional()
                .describe(`"paused" parks a running plan where it stands, "active" picks a paused one back up: only when the user asked`),
        }),
        run: async ({ args }) => {
            if (!args.steps && !args.status) {
                throw new AppError(`Send the new steps or a status to set: update_plan changes one of them.`);
            }

            const row = await grabBotPlan({ plan_id: args.plan_id });

            if (Number(row.session_id) != Number(session_id)) {
                throw new AppError(`Plan #${args.plan_id} belongs to another conversation: change that conversation's plan.`);
            }

            if (args.steps) {
                await saveBotPlanSteps({
                    plan_id: args.plan_id,
                    user_id,
                    title: args.title?.trim() || row.title || "",
                    goal: args.goal?.trim() || row.goal || "",
                    steps: args.steps,
                });
            }

            let moved = "";

            if (args.status) {
                if (args.status == "active" && row.status == "planned") {
                    throw new AppError(
                        `Plan #${args.plan_id} is waiting for the user to approve it: approval is theirs to give on its card, not for you to set.`,
                    );
                }

                const result = await setBotPlanStatus({ plan_id: args.plan_id, user_id, status: args.status });
                const at = currentPlanStepIndex({ steps: parseBotPlanSteps({ text: result.row.steps }) });

                moved =
                    args.status == "paused"
                        ? `Plan #${args.plan_id} is paused${at == null ? "" : ` at step ${at + 1}`}: say so in a line. It waits there until the user resumes it.`
                        : `Plan #${args.plan_id} is running again: if this message asked you to carry on, work its current step now and end on the step's card; otherwise say it is running and stop there.`;
            }

            onPlan({ ref: botPlanRef({ plan_id: args.plan_id }) });
            await pushBotPlan({ plan_id: args.plan_id, session_id, bot_id });

            return moved || `Plan #${args.plan_id} is updated and its card shows the new steps. Say in a line what changed and why, then carry on with the step you're on.`;
        },
    };
}
