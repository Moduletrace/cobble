import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import parseBotPlanSteps, { type BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
};

/**
 * The step one run finished, put back to pending (its note kept: the retry
 * reads what the earlier attempt made). `reopened` says whether that run had
 * finished a step at all, which is what lets a plan read `done` come back
 * when the run that ended it never delivered its report.
 */
export function reopenWorkedPlanStep({
    steps,
    job_id,
}: {
    steps: BotPlanStepRecord[];
    job_id: number;
}): { steps: BotPlanStepRecord[]; reopened: boolean } {
    const worked = steps.findIndex((step) => step.done_job_id === job_id);
    const step = worked < 0 ? undefined : steps[worked];

    if (!step) return { steps, reopened: false };

    const next = [...steps];
    next[worked] = { ...step, state: "pending" };

    return { steps: next, reopened: true };
}

/**
 * Pauses the plan a failed run was working a step of: nothing would ever
 * advance it, so it would show that step in progress forever and every later
 * reply in that conversation would be told the plan is under way and may not
 * move it. Paused, the card offers the step again (Resume queues it as it
 * stands). A step this run finished is put back with it, since the report that
 * delivered it never went out. A plan the user paused or ended meanwhile, or
 * one of another conversation, is left alone.
 */
export default async function pauseFailedPlanStep({ job }: Params) {
    const plan_id = Number(parseJobJson({ text: job.params })?.plan_id) || 0;

    if (!plan_id || !job.session_id) return null;

    const row = await grabBotPlan({ plan_id }).catch(() => null);

    if (!row?.id) return null;

    if (Number(row.session_id) != Number(job.session_id)) return null;

    /**
     * A step this run marked done is put back before the plan pauses: its
     * report never reached the user (a refused answer, a stop, a lost run),
     * so the card must not show it delivered or offer the step after it. A
     * plan the user ended meanwhile is left alone; `done` is reopened only
     * when this very run was the one that finished the last step.
     */
    const { steps, reopened } = reopenWorkedPlanStep({
        steps: parseBotPlanSteps({ text: row.steps }),
        job_id: Number(job.id),
    });

    if (row.status != "active" && !(row.status == "done" && reopened)) return null;

    const now = Date.now();

    const res = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE bot_plans SET steps = ?, status = 'paused', updated_at = ?
            WHERE id = ? AND status IN ('active', 'done') RETURNING id`,
        values: [JSON.stringify(steps), now, Number(row.id)],
    });

    if (!res.payload?.length) return null;

    return {
        plan_id: Number(row.id),
        session_id: Number(row.session_id),
        bot_id: Number(row.bot_id),
    };
}