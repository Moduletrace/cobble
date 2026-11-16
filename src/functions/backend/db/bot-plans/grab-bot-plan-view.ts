import type { BotPlanView } from "@/src/types";
import grabBotPlan from "./grab-bot-plan";
import toBotPlanView from "./to-bot-plan-view";

type Params = {
    plan_id: number | string;
    /**
     * Only the user it was made for reads it.
     */
    user_id: number | string;
};

/**
 * A plan as its card shows it, for the user it was made for. Throws
 * otherwise.
 */
export default async function grabBotPlanView({ plan_id, user_id }: Params) {
    const row = await grabBotPlan({ plan_id, user_id });

    return toBotPlanView({ row }) as BotPlanView;
}