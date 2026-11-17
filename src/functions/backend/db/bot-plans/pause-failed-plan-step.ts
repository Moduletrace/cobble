import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
};

/**
 * Pauses the plan a failed run was working a step of: nothing would ever
 * advance it, so it would show that step in progress forever and every later
 * reply in that conversation would be told the plan is under way and may not
 * move it. Paused, the card offers the step again (Resume queues it as it
 * stands). The step itself is left for that retry. A plan the user paused or
 * ended meanwhile, or one of another conversation, is left alone.
 */
export default async function pauseFailedPlanStep({ job }: Params) {
    const plan_id = Number(parseJobJson({ text: job.params })?.plan_id) || 0;

    if (!plan_id || !job.session_id) return null;

    const row = await grabBotPlan({ plan_id }).catch(() => null);

    if (!row?.id || row.status != "active") return null;

    if (Number(row.session_id) != Number(job.session_id)) return null;

    const res = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE bot_plans SET status = 'paused', updated_at = ?
            WHERE id = ? AND status = 'active' RETURNING id`,
        values: [Date.now(), Number(row.id)],
    });

    if (!res.payload?.length) return null;

    return {
        plan_id: Number(row.id),
        session_id: Number(row.session_id),
        bot_id: Number(row.bot_id),
    };
}