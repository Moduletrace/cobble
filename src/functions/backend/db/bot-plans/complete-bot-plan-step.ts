import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    plan_id: number | string;
    /**
     * The conversation the run is in: a plan is only worked where it was
     * written.
     */
    session_id: number | string;
    /**
     * What the step produced, in a line or two.
     */
    summary: string;
    /**
     * The run finishing it, kept on the step so a report that never went out
     * (a refused answer, a stop) puts the step back instead of leaving the
     * card offering the next one over a step nobody delivered.
     */
    job_id?: number | string;
};

/**
 * The bot finished the plan's current step: it's marked done with what it
 * produced, and the plan moves to the next one. The last step done ends
 * the plan.
 *
 * A step is only ever finished inside a run that did the work, one at a
 * time: a plan waiting on the user can't be worked, and neither can one
 * that's paused, ended, or has nothing left.
 */
export default async function completeBotPlanStep({ plan_id, session_id, summary, job_id }: Params) {
    const row = await grabBotPlan({ plan_id });

    if (Number(row.session_id) != Number(session_id)) {
        throw new AppError(`Plan #${row.id} belongs to another conversation: work that conversation's plan.`);
    }

    if (row.status == "planned") {
        throw new AppError(
            `Plan #${row.id} is waiting for the user to approve it on its card: don't work its steps yet. Answer them and let them decide.`,
        );
    }

    if (row.status != "active") {
        throw new AppError(`Plan #${row.id} is ${row.status}: there's no step to finish.`);
    }

    const steps = parseBotPlanSteps({ text: row.steps });
    const index = currentPlanStepIndex({ steps });

    if (index == null) {
        throw new AppError(`Every step of plan #${row.id} is already done.`);
    }

    const note = summary.trim().slice(0, AppData.BotPlanStepNoteMaxChars);
    const working = steps[index];

    if (!working) {
        throw new AppError(`Every step of plan #${row.id} is already done.`);
    }

    steps[index] = {
        text: working.text,
        state: "done",
        note,
        ...(Number(job_id) ? { done_job_id: Number(job_id) } : {}),
    };

    const next = currentPlanStepIndex({ steps });
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bot_plans SET steps = ?, status = ?, updated_at = ? WHERE id = ?`,
        values: [JSON.stringify(steps), next == null ? "done" : "active", now, Number(row.id)],
    });

    return {
        plan_id: Number(row.id),
        session_id: Number(row.session_id),
        bot_id: Number(row.bot_id),
        index,
        step: working.text,
        note,
        /**
         * The step to work next: null once the plan is finished.
         */
        next_step: next,
        done: next == null,
        steps,
    };
}