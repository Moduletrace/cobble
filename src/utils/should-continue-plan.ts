import type { BotPlanState } from "@/src/dict/bot-plan-dict";

type Params = {
    /**
     * The plan as it stands when the step's run ended: nothing is queued
     * when the user paused or ended it meanwhile. A row the schema gave no
     * status is not active, so it goes nowhere.
     */
    status: BotPlanState | "";
    /**
     * The reply asked the user something (`ask_user`), so the plan waits on
     * them rather than carrying on.
     */
    needs_you?: boolean;
    /**
     * The tools the run called: one that starts work (a task, a hand-over, a
     * request to another bot) has a report still to come, so the plan waits
     * for it instead of talking over it.
     */
    tool_names?: string[];
    /**
     * The plan's session and the finished step's: a step job is queued for
     * the conversation it belongs to, never another one's.
     */
    plan_session_id: number | string;
    session_id: number | string;
    /**
     * Every step is behind it: there is nothing left to queue.
     */
    has_pending_step: boolean;
    /**
     * A reply already waits in the conversation (a message the user sent
     * mid-step): its own run picks the plan up from there.
     */
    has_waiting_reply: boolean;
};

/**
 * The tools whose work reports back later: a run that called one has handed
 * something off, and the plan's next step would only cross it.
 */
export const WorkStartingTools = ["start_task", "delegate_task", "ask_bot", "hand_over_task"];

/**
 * Whether a plan's next step should be queued now that the run finished one.
 * Each reason to stop is one thing that happened in between: the user was
 * asked something, work was handed off, the plan was paused or ended, it has
 * no step left, or another reply is already queued in that conversation.
 */
export default function shouldContinuePlan({
    status,
    needs_you,
    tool_names,
    plan_session_id,
    session_id,
    has_pending_step,
    has_waiting_reply,
}: Params) {
    if (needs_you) return false;

    if ((tool_names || []).some((name) => WorkStartingTools.includes(name))) return false;

    if (Number(plan_session_id) != Number(session_id)) return false;

    if (status != "active") return false;

    if (!has_pending_step) return false;

    return !has_waiting_reply;
}