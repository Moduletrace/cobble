import BunSQLite from "@moduletrace/bun-sqlite";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import shouldContinuePlan from "@/src/utils/should-continue-plan";
import enqueuePlanStep from "./enqueue-plan-step";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    plan_id: number | string;
    session_id: number | string;
    /**
     * The reply asked the user something (`ask_user`), so it waits on them
     * rather than carrying on.
     */
    needs_you?: boolean;
    /**
     * The tools the run called: one that starts work (a task, a hand-over,
     * a request to another bot) has a report still to come, so the plan
     * waits for it instead of talking over it.
     */
    tool_names?: string[];
};

/**
 * Carries a plan on after a run finished a step: the bot reports the step it
 * finished, and this wakes it for the next one, so the work runs through the
 * plan step by step without the user nudging it each time.
 *
 * Nothing is queued when the run is waiting on the user, when it started
 * work whose report is still to come, when the plan was paused or cancelled
 * meanwhile, or when the conversation already has a reply waiting (a message
 * the user sent mid-step, whose own run picks the plan up from there).
 */
export default async function continueBotPlan({ plan_id, session_id, needs_you, tool_names }: Params) {
    const row = await grabBotPlan({ plan_id });
    const steps = parseBotPlanSteps({ text: row.steps });

    const waiting = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bots_queue
                WHERE session_id = ? AND kind = 'reply' AND status IN ('pending', 'processing')
                LIMIT 1`,
            values: [Number(session_id)],
        })
    ).payload?.[0];

    const carry_on = shouldContinuePlan({
        status: row.status || "",
        needs_you,
        tool_names,
        plan_session_id: row.session_id,
        session_id,
        has_pending_step: currentPlanStepIndex({ steps }) != null,
        has_waiting_reply: Boolean(waiting),
    });

    if (!carry_on) return null;

    return await enqueuePlanStep({ plan_id: row.id });
}