import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotPlanView } from "@/src/types";

type Params = {
    plan_id: number;
};

/**
 * One plan a bot wrote (`api/admin/bot-plans/get-plan`), for its card.
 */
export default async function fetchBotPlan({ plan_id }: Params) {
    return await fetchApi<{}, APIResponseObject<BotPlanView>>(
        `/api/admin/bot-plans/get-plan?plan_id=${encodeURIComponent(String(plan_id))}`,
        { method: "GET" },
    );
}