import type { HarnessTool } from "../../../types";
import cancelPlanTool from "./cancel-plan-tool";
import completePlanStepTool from "./complete-plan-step-tool";
import createPlanTool from "./create-plan-tool";
import updatePlanTool from "./update-plan-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The run is a plan's own step: it has a plan to finish, and no reason
     * to write one or end one.
     */
    on_step?: boolean;
    /**
     * A scheduled run, which nobody watches: a plan it writes is approved
     * at once and worked through in the run (`ScheduledPlanNote`).
     */
    approve?: boolean;
    /**
     * Called with each plan's ref, so the message carries its card.
     */
    onPlan: (params: { ref: string; waiting?: boolean }) => void;
};

/**
 * The tools a bot plans with: `create_plan` when work is several steps,
 * `update_plan` when what it found makes the rest wrong, and
 * `complete_plan_step` to finish the step it worked. A chat reply's plan
 * waits on its card for the user; a scheduled run's is approved at once,
 * since nobody is there to approve it.
 *
 * A run that is itself working a plan gets neither `create_plan` (the
 * conversation already has one open) nor `cancel_plan` (whether the plan
 * stands is the user's call), so the only thing it can do is work it.
 */
export default function grabBotPlanTools({ user_id, bot_id, session_id, workspace_id, on_step, approve, onPlan }: Params) {
    const tools: HarnessTool[] = [];

    if (!on_step) {
        tools.push(createPlanTool({ user_id, bot_id, session_id, workspace_id, approve, onPlan }));

        if (!approve) {
            tools.push(cancelPlanTool({ user_id, bot_id, session_id }));
        }
    }

    tools.push(updatePlanTool({ user_id, bot_id, session_id, onPlan }));
    tools.push(completePlanStepTool({ bot_id, session_id, in_run: approve }));

    return tools;
}