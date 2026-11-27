import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_PLANS, BunSQLiteTables } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import type { BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";
import grabSessionPlan from "./grab-session-plan";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    title: string;
    goal?: string;
    /**
     * The steps in the order they're worked.
     */
    steps: string[];
};

/**
 * Stores a plan a bot wrote, waiting for the user's approval (`planned`).
 * One plan is open in a conversation at a time: the bot works the one it
 * has before writing another. Returns the plan's id.
 */
export default async function createBotPlan({ user_id, bot_id, session_id, workspace_id, title, goal, steps }: Params) {
    const open = await grabSessionPlan({ session_id });

    if (open) {
        throw new AppError(
            `There's already a plan open in this conversation (#${open.id}, "${open.title || "untitled"}"): work that one, or refine it with update_plan, or cancel it before writing another.`,
        );
    }

    const records: BotPlanStepRecord[] = steps.map((step) => ({ text: step, state: "pending", note: "" }));

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_PLANS, (typeof BunSQLiteTables)[number]>({
        table: "bot_plans",
        data: [
            {
                title,
                goal: goal || "",
                steps: JSON.stringify(records),
                status: "planned",
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the plan: ${res.msg}`);

    return id;
}