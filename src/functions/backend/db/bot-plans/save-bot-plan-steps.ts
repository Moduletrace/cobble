import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import planStepsRewriteProblem from "@/src/utils/plan-steps-rewrite-problem";
import parseBotPlanSteps, { type BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    plan_id: number | string;
    user_id: number | string;
    title: string;
    goal?: string;
    /**
     * The plan's steps as the user wants them, in order.
     */
    steps: string[];
};

/**
 * The user changed a plan's steps on its card, before the bot starts or
 * while it's working. A step already done (or skipped) is the record of work
 * that really happened: it stays where it is and keeps its note, so it may
 * not be changed or dropped, and the steps before it are its own. Everything
 * after is theirs to rewrite, reorder, add to or cut. A plan left with
 * nothing to work is done.
 */
export default async function saveBotPlanSteps({ plan_id, user_id, title, goal, steps }: Params) {
    const row = await grabBotPlan({ plan_id, user_id });

    if (row.status != "planned" && row.status != "active" && row.status != "paused") {
        throw new AppError(`This plan is ${row.status}: there's nothing left to change in it.`);
    }

    const existing = parseBotPlanSteps({ text: row.steps });
    const finished = existing.filter((step) => step.state != "pending");
    const by_text = new Map(finished.map((step) => [step.text.toLowerCase(), step]));

    const next: BotPlanStepRecord[] = steps.map((text) => {
        const kept = by_text.get(text.toLowerCase());

        return kept ? { ...kept } : { text, state: "pending" as const, note: "" };
    });

    const rewrite_problem = planStepsRewriteProblem({ finished, next });

    if (rewrite_problem) throw new AppError(rewrite_problem);

    const now = Date.now();
    const done = currentPlanStepIndex({ steps: next }) == null;

    await BunSQLite.sql({
        sql: `UPDATE bot_plans SET title = ?, goal = ?, steps = ?, status = ?, updated_at = ? WHERE id = ?`,
        values: [
            title,
            goal || "",
            JSON.stringify(next),
            done ? "done" : row.status,
            now,
            Number(row.id),
        ],
    });

    return await grabBotPlan({ plan_id: row.id, user_id });
}