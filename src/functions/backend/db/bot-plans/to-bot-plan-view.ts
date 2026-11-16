import type { BUN_SQLITE_COBBLE_BOT_PLANS } from "@/db/types/db";
import type { BotPlanState } from "@/src/dict/bot-plan-dict";
import type { BotPlanView } from "@/src/types";
import currentPlanStepIndex from "@/src/utils/current-plan-step-index";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import planStepCounts from "@/src/utils/plan-step-counts";

type Params = {
    row: BUN_SQLITE_COBBLE_BOT_PLANS & { bot_name?: string };
};

/**
 * A plan's row as the card and a prompt read it: its steps parsed, where it
 * stands, and how much of it is behind it. One shape for both, so the card
 * never shows something the bot wasn't told.
 */
export default function toBotPlanView({ row }: Params): BotPlanView {
    const steps = parseBotPlanSteps({ text: row.steps });
    const counts = planStepCounts({ steps });

    return {
        id: Number(row.id),
        title: row.title || "",
        goal: row.goal || "",
        steps,
        status: (row.status || "planned") as BotPlanState,
        current_step: currentPlanStepIndex({ steps }),
        finished_steps: counts.finished,
        total_steps: counts.total,
        decided_at: row.decided_at ? Number(row.decided_at) : null,
        created_at: Number(row.created_at) || 0,
        updated_at: Number(row.updated_at) || 0,
        user_id: Number(row.user_id),
        bot_id: Number(row.bot_id),
        bot_name: row.bot_name || "",
        session_id: Number(row.session_id),
        workspace_id: row.workspace_id ? Number(row.workspace_id) : null,
    };
}