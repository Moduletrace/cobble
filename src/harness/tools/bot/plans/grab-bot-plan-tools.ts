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
     * The plan this run sits in is approved (running, or paused and about
     * to be picked back up): an ordinary reply (or a task run the user
     * follows) may work a step the message asked for, and must tick it and
     * end on the card like a step's own run. A step of a still-paused plan
     * is refused at the row, so resume comes first.
     */
    can_complete?: boolean;
    /**
     * A task run: writing or cancelling a plan stays a reply's job.
     */
    writes_plan?: boolean;
    /**
     * Called when the run finishes a step, so its message links the plan and
     * its card belongs to it.
     */
    onCompleted?: (params: { plan_id: number }) => void;
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
 * `update_plan` when what it found makes the rest wrong (or to park and
 * pick up a plan the user asked about), and `complete_plan_step` to finish
 * the step it worked. A plan waits on its card for the user; only a chat
 * reply writes one, since routines and hook calls already have their plan.
 *
 * A run that is itself working a plan gets neither `create_plan` (the
 * conversation already has one open) nor `cancel_plan` (whether the plan
 * stands is the user's call), so the only thing it can do is work it.
 *
 * A step is finished by a run that did the work: the step's own run, or an
 * ordinary attended run whose message asked for that step. A run that
 * ticks one owes the plan its card, and the step review sends it back
 * until the card is up beside the report.
 */
export default function grabBotPlanTools({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    on_step,
    can_complete,
    writes_plan = true,
    onCompleted,
    onPlan,
    job_id,
}: Params) {
    const tools: HarnessTool[] = [];

    if (!on_step && writes_plan) {
        tools.push(createPlanTool({ user_id, bot_id, session_id, workspace_id, onPlan }));
        tools.push(cancelPlanTool({ user_id, bot_id, session_id }));
    }

    tools.push(updatePlanTool({ user_id, bot_id, session_id, onPlan }));

    if (on_step || can_complete) {
        tools.push(completePlanStepTool({ bot_id, session_id, job_id, onCompleted }));
    }

    return tools;
}
