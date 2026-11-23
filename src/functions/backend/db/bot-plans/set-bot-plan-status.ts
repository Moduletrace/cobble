import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotPlanState } from "@/src/dict/bot-plan-dict";
import AppError from "@/src/utils/app-error";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import grabBotPlan from "./grab-bot-plan";

type Params = {
    plan_id: number | string;
    user_id: number | string;
    status: BotPlanState;
};

/**
 * The user moved a plan from its card: approved it (which starts it),
 * paused it where it is, picked it back up, or ended it. Only the moves
 * that mean something from where it stands are allowed, so a double click
 * changes nothing and a finished plan never comes back.
 *
 * Returns the row as it now stands and whether it just started, which is
 * when the bot is woken for the step it stands on.
 */
export default async function setBotPlanStatus({ plan_id, user_id, status }: Params) {
    const row = await grabBotPlan({ plan_id, user_id });
    const current = row.status as BotPlanState;

    const steps = parseBotPlanSteps({ text: row.steps });
    const caught_up = currentPlanStepIndex({ steps }) == null;

    /**
     * Already where it's being sent: nothing changes, but "active" is also
     * how the user starts a step that isn't running (Continue on the card),
     * so it wakes the bot when a step is still left.
     */
    if (current == status) return { row, started: status == "active" && !caught_up };

    if (current == "done" || current == "cancelled") {
        throw new AppError(`This plan is ${current}: it can't be picked up again.`);
    }

    if (status == "active") {
        if (current != "planned" && current != "paused") {
            throw new AppError(`This plan is ${current}: it isn't paused.`);
        }

        if (caught_up) {
            throw new AppError(`Every step of this plan is already done: there's nothing to start.`);
        }
    }

    if (status == "paused" && current != "active") {
        throw new AppError(`Only a plan that's running can be paused.`);
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bot_plans SET status = ?, decided_at = ?, updated_at = ? WHERE id = ?`,
        values: [
            status,
            status == "active" || status == "cancelled" ? now : row.decided_at || null,
            now,
            Number(row.id),
        ],
    });

    return {
        row: await grabBotPlan({ plan_id: row.id, user_id }),
        /**
         * Approved for the first time: the bot picks the plan up now. A
         * resume after a pause is the same move from the user's side.
         */
        started: status == "active",
    };
}