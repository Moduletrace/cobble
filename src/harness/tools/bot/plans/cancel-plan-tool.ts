import { z } from "zod";
import grabBotPlan from "@/src/functions/backend/db/bot-plans/grab-bot-plan";
import setBotPlanStatus from "@/src/functions/backend/db/bot-plans/set-bot-plan-status";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import AppError from "@/src/utils/app-error";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
};

type Args = {
    plan_id: number;
    reason: string;
};

/**
 * The user dropped the plan (they said so, or the work it was for is gone),
 * so the bot ends it rather than leaving a card that will never move. Its
 * steps stop there: nothing more is queued for it.
 */
export default function cancelPlanTool({ user_id, bot_id, session_id }: Params): HarnessTool<Args> {
    return {
        name: "cancel_plan",
        description: `End a plan in this conversation, once the user has said the work it was for is off or they want it dropped. Never to make a plan that is going badly look finished: a plan you can't carry on with is theirs to end too, so ask them. Say in a line that it's cancelled, and why.`,
        schema: z.object({
            plan_id: z.number().int().positive().describe(`The plan's id, as your prompt gives it`),
            reason: z.string().trim().min(1).max(300).describe(`Why it's off, in one line`),
        }),
        run: async ({ args }) => {
            const row = await grabBotPlan({ plan_id: args.plan_id });

            if (Number(row.session_id) != Number(session_id)) {
                throw new AppError(`Plan #${args.plan_id} belongs to another conversation: cancel that conversation's plan.`);
            }

            await setBotPlanStatus({ plan_id: args.plan_id, user_id, status: "cancelled" });
            await pushBotPlan({ plan_id: args.plan_id, session_id, bot_id });

            return `Plan #${args.plan_id} is cancelled (${args.reason}) and its card says so. Nothing more runs for it. Say in a line that it's off and what stands done, then answer normally.`;
        },
    };
}