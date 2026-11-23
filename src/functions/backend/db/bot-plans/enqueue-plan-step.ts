import BunSQLite from "@moduletrace/bun-sqlite";
import { BotReplyJobTitle } from "@/src/dict/bot-queue-dict";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    plan_id: number | string;
};

/**
 * Wakes the bot for its plan's current step: one reply job, which works
 * that step and reports it. Nothing is queued for a plan that isn't
 * running, or one with no step left, so approving a finished plan, a double
 * click or a stop never leaves a run with nothing to do.
 *
 * The step itself is read by the run from the conversation's plan, never
 * from here: a run that starts late still works the step that's actually
 * next.
 */
export default async function enqueuePlanStep({ plan_id }: Params) {
    const row = await grabBotPlan({ plan_id });

    if (row.status != "active") return null;

    const steps = parseBotPlanSteps({ text: row.steps });

    if (currentPlanStepIndex({ steps }) == null) return null;

    /**
     * A step is already queued or running for this plan: Continue twice, or
     * Continue while the step works, must not start a second run on it.
     */
    const open = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM bots_queue WHERE session_id = ? AND status IN ('pending', 'processing') AND json_extract(params, '$.plan_id') = ? LIMIT 1`,
        values: [Number(row.session_id), Number(row.id)],
    });

    if ((open.payload || []).length > 0) return null;

    const user_id = Number(row.user_id);

    const job_id = await enqueueBotJob({
        kind: "reply",
        user_id,
        bot_id: Number(row.bot_id),
        session_id: Number(row.session_id),
        title: BotReplyJobTitle,
        instructions: "Work the current step of the plan in this conversation, then report it.",
        params: { plan_id: Number(row.id) },
    });

    return job_id;
}