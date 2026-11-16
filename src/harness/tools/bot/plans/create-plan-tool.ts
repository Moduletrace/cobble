import { z } from "zod";
import createBotPlan from "@/src/functions/backend/db/bot-plans/create-bot-plan";
import setBotPlanStatus from "@/src/functions/backend/db/bot-plans/set-bot-plan-status";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import { BotPlanGoalSchema, BotPlanStepTextsSchema, BotPlanTitleSchema } from "@/src/schemas/bot-plan-schema";
import botPlanRef from "@/src/utils/bot-plan-ref";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * A scheduled run, which nobody watches: the plan is approved at once,
     * since there is no card for someone to approve it on.
     */
    approve?: boolean;
    /**
     * Called with the plan's ref, so the message carries its card. `waiting`
     * says nobody approved it yet: the user is needed for it to go on.
     */
    onPlan: (params: { ref: string; waiting?: boolean }) => void;
};

type Args = {
    title: string;
    goal?: string;
    steps: z.infer<typeof BotPlanStepTextsSchema>;
};

/**
 * The bot broke work into a plan. In a chat it waits on its card for the
 * user to approve (or change) it, and the app then wakes the bot one step at
 * a time. In a scheduled run nobody is there to approve anything, so the
 * plan starts itself and the run works through it.
 */
export default function createPlanTool({ user_id, bot_id, session_id, workspace_id, approve, onPlan }: Params): HarnessTool<Args> {
    return {
        name: "create_plan",
        description: approve
            ? `Write the plan for work that is several steps, before starting it: the goal that says what finished looks like, and 3 to 6 steps in the order you'd do them, one line each, each naming what it produces. Nobody is watching this run, so it's approved at once and you work it here: call complete_plan_step after each step.`
            : `Write the plan for work that is several steps, before starting it: the goal that says what finished looks like, and 3 to 6 steps in the order you'd do them, one line each, each naming what it produces. It goes to the user as a card in this conversation, and nothing of it runs until they approve it (they can change the steps first). Write the plan instead of answering with a long list of everything you're about to do. Only when a plan is already open in this conversation, work it instead.`,
        schema: z.object({
            title: BotPlanTitleSchema.describe(`A short name for the work, e.g. "Audit the pricing pages"`),
            goal: BotPlanGoalSchema.describe(`What the plan is for and what "done" means, in one sentence`),
            steps: BotPlanStepTextsSchema.describe(`The steps in the order they're worked, each one line`),
        }),
        run: async ({ args }) => {
            const plan_id = await createBotPlan({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                title: args.title,
                goal: args.goal,
                steps: args.steps,
            });

            if (approve) {
                await setBotPlanStatus({ plan_id, user_id, status: "active" });
            }

            onPlan({ ref: botPlanRef({ plan_id }), waiting: !approve });
            await pushBotPlan({ plan_id, session_id, bot_id });

            const count = args.steps.length;

            if (approve) {
                return `Plan #${plan_id} is written (${count} step${count == 1 ? "" : "s"}), and it's approved already because this run isn't watched. Work its steps in this run, calling complete_plan_step after each with what it produced.`;
            }

            return `Plan #${plan_id} is on its card in the conversation (${count} step${count == 1 ? "" : "s"}) and nothing of it runs until the user approves it. Say in one sentence that you wrote it and that they can change it before it starts; don't repeat the steps and don't work any of them now. When they approve it, you'll be woken for the first step.`;
        },
    };
}