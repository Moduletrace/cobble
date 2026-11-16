import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotPlanView } from "@/src/types";

type Params = {
    plan_id: number;
    title: string;
    goal?: string;
    steps: string[];
};

/**
 * The user changed a plan's steps on its card, before approving it or while
 * it runs. Returns the plan as it now stands.
 */
export default async function saveBotPlan({ plan_id, title, goal, steps }: Params) {
    return await fetchApi<Omit<Params, "plan_id"> & { plan_id: number }, APIResponseObject<BotPlanView>>(
        `/api/admin/bot-plans/save-plan`,
        { method: "POST", body: { plan_id, title, goal, steps } },
    );
}