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
     * Called with each plan's ref, so the message carries its card.
     */
    onPlan: (params: { ref: string; waiting?: boolean }) => void;
    /**
     * The run these tools belong to, kept on a step the run finishes (see
     * `completeBotPlanStep`).
     */
    job_id?: number | string;
};

/**
 * The tools a bot plans with: `create_plan` when work is several steps,
 * `update_plan` when what it found makes the rest wrong, and
 * `complete_plan_step` to finish the step it worked. A plan waits on its
 * card for the user; only a chat reply writes one, since routines and hook
 * calls already have their plan.
 *
 * A run that is itself working a plan gets neither `create_plan` (the
 * conversation already has one open) nor `cancel_plan` (whether the plan
 * stands is the user's call), so the only thing it can do is work it.
 *
 * Only a step's own run can finish a step: a reply that isn't one would
 * finish it with no card under its report, and the plan would sit active
 * with nothing to start the next one.
 */
export default function grabBotPlanTools({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    on_step,
    onPlan,
    job_id,
}: Params) {
    const tools: HarnessTool[] = [];

    if (!on_step) {
        tools.push(createPlanTool({ user_id, bot_id, session_id, workspace_id, onPlan }));
        tools.push(cancelPlanTool({ user_id, bot_id, session_id }));
    }

    tools.push(updatePlanTool({ user_id, bot_id, session_id, onPlan }));

    if (on_step) tools.push(completePlanStepTool({ bot_id, session_id, job_id }));

    return tools;
}
