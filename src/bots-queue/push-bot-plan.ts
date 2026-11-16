import type { BotPlanChangedData } from "@/src/types";
import pushToSessionUser from "./push-to-session-user";

type Params = {
    plan_id: number | string;
    session_id: number | string;
    bot_id: number | string;
};

/**
 * Tells the open tabs of the user a plan belongs to that it changed
 * (written, a step done, approved, edited), so every card of it reloads
 * what it shows. A plan only ever shows in its own conversation.
 */
export default async function pushBotPlan({ plan_id, session_id, bot_id }: Params) {
    const data: BotPlanChangedData = {
        plan_id: Number(plan_id),
        session_id: Number(session_id),
        bot_id: Number(bot_id),
    };

    await pushToSessionUser({
        session_id,
        data: { event: "server:bot-plan", data },
    });
}