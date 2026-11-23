import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotPlanState } from "@/src/dict/bot-plan-dict";
import type { BotPlanView } from "@/src/types";

type Params = {
    plan_id: number;
    /**
     * Approve it, pick it back up, start its next step, pause it, or end it.
     */
    status: Extract<BotPlanState, "active" | "paused" | "cancelled">;
};

/**
 * Moves a plan from its card. Approving it, picking it back up, or Continue
 * wakes the bot for the step it stands on.
 */
export default async function setBotPlanState({ plan_id, status }: Params) {
    return await fetchApi<Params, APIResponseObject<BotPlanView>>(`/api/admin/bot-plans/set-plan-status`, {
        method: "POST",
        body: { plan_id, status },
    });
}